import copy
import logging
import os
import pickle
from typing import Any, Union

import numpy as np
import torch
import tqdm
import umap
from hdbscan import HDBSCAN
from pydantic import Field
from sklearn.cluster import DBSCAN
from torch.nn.utils.rnn import pad_sequence
from torch.utils.data import DataLoader
from transformers import BertModel, BertTokenizerFast
from umap_pytorch import PUMAP

from utilities.string_operations import get_root_path
from utilities.timer import Timer

logger = logging.getLogger(__name__)


class Umap:
    arguments: dict = Field(dict(), description="Arguments for Umap")
    name: str = ""
    fitted: bool = False

    def __init__(self, arguments: dict = None):
        if arguments is not None:
            self.arguments = arguments
        self._model = None

    def fit(self, data: Union[np.ndarray, list]) -> bool:
        if len(data) == 0:
            raise ValueError("The data is empty.")
        self._model = umap.UMAP(**self.arguments)
        self._model.fit(data)
        self.fitted = True
        return True

    def transform(self, data: Union[np.ndarray, list]) -> np.ndarray:
        if len(data) == 0:
            return np.array([])
        logger.info(f"Umap.transform() with #{len(data)} embeddings")
        if self._model is None:
            raise ValueError("The UMAP model has not been fitted yet.")
        transformed_data = self._model.transform(data)
        return transformed_data

    def __str__(self):
        return f"Umap({self.arguments})"


class Hdbscan:
    arguments: dict = Field(dict(), description="Arguments for Umap")
    name: str = ""
    fitted: bool = True

    def __init__(self, arguments: dict = None):
        if arguments is None:
            arguments = {}
        self.arguments = arguments

    def fit(self):
        return True

    def transform(self, data: Union[np.ndarray, list]) -> np.ndarray:
        if len(data) == 0:
            raise ValueError("The data is empty.")

        model = HDBSCAN(**self.arguments)
        return model.fit_predict(data)


class Dbscan:
    arguments: dict = Field(dict(), description="Arguments for Umap")
    name: str = ""
    fitted: bool = True

    def __init__(self, arguments: dict = None):
        if arguments is None:
            arguments = {}
        self.arguments = arguments

    def fit(self):
        return True

    def transform(self, data: Union[np.ndarray, list]) -> np.ndarray:
        if len(data) == 0:
            raise ValueError("The data is empty.")

        model = DBSCAN(**self.arguments)
        return model.fit_predict(data)


class SemiSupervisedUmap(Umap):
    def fit(self, data: Union[np.ndarray, list], labels: np.ndarray = None) -> bool:
        logger.info(f"SemiSupervisedUmap.fit() from {self.arguments}")
        if len(data) == 0:
            raise ValueError("The data is empty.")
        self._model = umap.UMAP(**self.arguments)
        self._model.fit(data, y=labels)
        self.fitted = True
        return True

    def __str__(self):
        return f"SemiSupervisedUmap({self.arguments})"


class BertEmbeddingModel:
    arguments: dict = {}
    name: str = ""
    fitted: bool = False

    def __init__(self, arguments: dict):
        self.arguments = arguments

    def fit(self, segments, sentences):
        logger.info(f"BertEmbedding.fit() from {self.arguments}")
        if segments is None or sentences is None:
            raise ValueError("The data is empty.")
        self.fitted = True

    def collate_fn(self, batch):
        input_ids, attention_mask, offset_mapping, sentence_id = zip(*batch)
        input_ids = [torch.tensor(x) for x in input_ids]
        attention_mask = [torch.tensor(x) for x in attention_mask]
        input_ids = pad_sequence(input_ids, batch_first=True, padding_value=0)
        attention_mask = pad_sequence(attention_mask, batch_first=True, padding_value=0)
        return input_ids, attention_mask, offset_mapping, sentence_id

    def transform(self, segments, sentences, batch_size, use_disk_storage):
        unique_sentences = list(set(sentences))
        logger.info(f"BertEmbedding.transform() with #{len(segments)} segments")
        if len(segments) == 0:
            return np.array([])
        with Timer("Calculate Sentence Embeddings"):
            sentence_embedding = self.transform_sentences(
                unique_sentences, batch_size=batch_size, use_disk_storage=use_disk_storage
            )
        with Timer("Calculating Segment Offset Indexes"):
            positions = self.get_segment_positions(
                segments, sentences, sentence_embedding
            )
        return self.segment_embedding(
            [sentence_embedding[s.sentence_id][0] for s in sentences], positions
        )

    def transform_sentences(self, sentences, batch_size=124, use_disk_storage=False):
        tokenizer = BertTokenizerFast.from_pretrained(**self.arguments)
        model = BertModel.from_pretrained(**self.arguments)
        max_input_length = model.config.max_position_embeddings
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        # Das speichern der Satz ids und texte.
        with Timer("Fetching Dataset"):
            sentences_id = np.array([s.sentence_id for s in sentences])
            sentences_text = [s.text for s in sentences]

        # Tokenization
        with Timer("Tokenization"):
            inputs = tokenizer(
                sentences_text,
                return_tensors="np",
                return_offsets_mapping=True,
                return_attention_mask=True,
                max_length=max_input_length,
            )

        # Sortieren der Sätze nach der Länge
        with Timer("Sorting"):
            # sortiert von lang nach kurz, damit es schnell abbricht falls die maximale größe nicht unterstützt wird
            sorted_indices = np.argsort([-len(ids) for ids in inputs["input_ids"]])
            sorted_input_ids_array = inputs["input_ids"][sorted_indices]
            sorted_attention_mask_array = inputs["attention_mask"][sorted_indices]
            sorted_offset_mapping_array = inputs["offset_mapping"][sorted_indices]
            sorted_sentences_id = sentences_id[sorted_indices]

        # Erstellen des Datasets und Dataloader
        with Timer("Creating Dataset and Loader"):
            # Torch Approach Note: Be carefull with large batch size, to large files for torch.save can crash operating system. Using pickle instead.
            dataset = np.stack(
                (
                    sorted_input_ids_array,
                    sorted_attention_mask_array,
                    sorted_offset_mapping_array,
                    sorted_sentences_id,
                ),
                axis=1,
            )
            dataloader = DataLoader(
                dataset, batch_size=batch_size, shuffle=False, collate_fn=self.collate_fn
            )

        model.eval()  # Set the model to evaluation mode

        all_embeddings = {}

        if not use_disk_storage:
            for i, (
                batch_input_ids,
                batch_attention_mask,
                batch_offset_mapping,
                batch_sentence_ids,
            ) in enumerate(tqdm.tqdm(dataloader)):
                # Alle 10 batches die GPU leeren
                if i % 10 == 0:
                    torch.cuda.empty_cache()

                # Prepare the batch
                batch_inputs = {
                    "input_ids": batch_input_ids,
                    "attention_mask": batch_attention_mask,
                }

                if torch.cuda.is_available():
                    batch_inputs = {
                        key: tensor.to(device) for key, tensor in batch_inputs.items()
                    }

                with torch.no_grad():
                    outputs = model(**batch_inputs)
                    embeddings = outputs.last_hidden_state
                    embeddings = embeddings.cpu().numpy()
                    all_embeddings.update(
                        {
                            id: (embedding, offset, mask)
                            for id, embedding, offset, mask in zip(
                                batch_sentence_ids,
                                embeddings,
                                batch_offset_mapping,
                                batch_attention_mask,
                            )
                        }
                    )
        else:
            # Important Note: Using disc storage can double the time needed for the embedding calculation.
            all_embeddings_list = []
            export_folder = os.path.join(get_root_path(), "tmp")
            os.makedirs(export_folder, exist_ok=True)

            for i, (
                batch_input_ids,
                batch_attention_mask,
                batch_offset_mapping,
                batch_sentence_ids,
            ) in enumerate(tqdm.tqdm(dataloader)):
                # Alle 10 batches die GPU leeren
                if i % 10 == 0:
                    torch.cuda.empty_cache()

                # Prepare the batch
                batch_inputs = {
                    "input_ids": batch_input_ids,
                    "attention_mask": batch_attention_mask,
                }

                if torch.cuda.is_available():
                    batch_inputs = {
                        key: tensor.to(device) for key, tensor in batch_inputs.items()
                    }

                with torch.no_grad():
                    outputs = model(**batch_inputs)
                    embeddings = outputs.last_hidden_state
                    embeddings = embeddings.cpu().numpy()
                    all_embeddings_list.append(
                        [
                            batch_sentence_ids,
                            embeddings,
                            batch_offset_mapping,
                            batch_attention_mask,
                        ]
                    )
                pickle.dump(all_embeddings_list, open(export_folder + f"/{i}.pkl", "wb"))
                all_embeddings_list = []

            # load all embeddings
            for i in range(len(dataloader)):
                pickle_array = pickle.load(open(export_folder + f"/{i}.pkl", "rb"))[0]
                for id, embedding, offset, mask in zip(*pickle_array):
                    all_embeddings[id] = (embedding, offset, mask)

            # delete all files
            for i in range(len(dataloader)):
                os.remove(export_folder + f"/{i}.pkl")

        return all_embeddings

    def get_segment_positions(self, segments, sentence, embeddings):
        def find_subrange(true_range, all_ranges):
            start, end = true_range
            mask = (
                (all_ranges[:, 0] <= end)
                & (all_ranges[:, 1] >= start)
                & (all_ranges[:, 0] != all_ranges[:, 1])
            )
            mask = torch.Tensor(mask)
            result = torch.nonzero(mask).squeeze().tolist()
            del mask
            return result

        results = []
        for i in range(len(segments)):
            id = sentence[i].sentence_id
            start = segments[i].start_position
            len_seg = len(segments[i].text)
            attention_mask = embeddings[id][2]
            offset = embeddings[id][1]
            valid_length = (
                torch.where(attention_mask == 0)[0][0]
                if 0 in attention_mask
                else len(attention_mask)
            )
            temp_offsets = offset[:valid_length]
            result = find_subrange((start, start + len_seg), temp_offsets)
            if type(result) != type([]):
                result = [result]
            results.append(result)  #
            del valid_length, temp_offsets, start, len_seg

        return results

    def segment_embedding(self, embeddings, positions):
        averaged_embeddings = []
        for emb, pos in zip(embeddings, positions):
            selected_embeddings = emb[pos, :]
            mean_embedding = np.mean(selected_embeddings, axis=0)
            averaged_embeddings.append(mean_embedding)
        averaged_embeddings = np.array(averaged_embeddings)
        return averaged_embeddings

    def get_segment_string(self, segment):
        sentence = segment.sentence.text
        return sentence

    def __str__(self):
        temp = copy.deepcopy(self.default_parameters)
        temp.update(self.arguments)
        return f"BertEmbeddingModel({temp})"


class DynamicBertModel(BertEmbeddingModel):
    is_dynamic: bool = True
    train: bool = False

    def __str__(self):
        temp = copy.deepcopy(self.default_parameters)
        temp.update(self.arguments)
        return f"DynamicBertEmbeddingModel({temp})"


class DynamicUmap:
    arguments: dict = Field(dict(), description="Arguments for PUMAP")
    name: str = ""
    fitted: bool = False
    is_dynamic: bool = True
    train: bool = False

    def __init__(self, arguments: dict = None):
        if arguments is not None:
            self.arguments = arguments
        self._model = None

    def fit(self, data: Union[np.ndarray, list]) -> bool:
        if len(data) == 0:
            raise ValueError("The data is empty.")
        self._model = PUMAP(**self.arguments)
        if type(data) == type(np.ndarray([])):
            data = torch.tensor(data)
        self._model.fit(data)
        self.fitted = True
        return True

    def transform(self, data: Union[np.ndarray, list]) -> np.ndarray:
        if len(data) == 0:
            return np.array([])
        logger.info(f"Umap.transform() with #{len(data)} embeddings")
        if self._model is None:
            raise ValueError("The UMAP model has not been fitted yet.")
        if type(data) != type(torch.tensor([])):
            data = torch.tensor(data)
        transformed_data = self._model.transform(data)
        return transformed_data

    def __str__(self):
        return f"DynamicUmap({self.arguments})"


MODELS = {
    "umap": Umap,
    "semisupervised_umap": SemiSupervisedUmap,
    "bert": BertEmbeddingModel,
    "dbscan": Dbscan,
    "hdbscan": Hdbscan,
    "dynamic_bert": DynamicBertModel,
    "dynamic_umap": DynamicUmap,
}


def test():
    pass
