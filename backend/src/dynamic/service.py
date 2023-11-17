import logging
from random import choices

import numpy as np
import torch
from torch import nn, optim
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm

from db.models import Cluster, ReducedEmbedding
from models.model_definitions import DynamicUmap
from reduced_embeddings.router import extract_embeddings_reduced_endpoint
from utilities.timer import Timer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CustomDataset(Dataset):
    def __init__(self, dataframe):
        self.dataframe = dataframe

    def __len__(self):
        return len(self.dataframe)

    def __getitem__(self, idx):
        if torch.is_tensor(idx):
            idx = idx.tolist()

        embedding = torch.tensor(
            self.dataframe.iloc[idx]["embedding"], dtype=torch.float32
        )
        label = torch.tensor(self.dataframe.iloc[idx]["label"], dtype=torch.long)

        sample = {"embedding": embedding, "label": label}

        return sample


def form_triplets(outputs, labels, num_triplets=30):
    """ find anchors positives and negatives for triplet loss"""
    anchors, positives, negatives = [], [], []
    unique_labels = torch.unique(labels)

    for label in unique_labels:
        label_mask = labels == label
        other_label_mask = labels != label
        label_indices = torch.nonzero(label_mask).squeeze(1)
        other_label_indices = torch.nonzero(other_label_mask).squeeze(1)

        anchor_choices = choices(label_indices.tolist(), k=num_triplets)
        positive_choices = choices(label_indices.tolist(), k=num_triplets)
        negative_choices = choices(other_label_indices.tolist(), k=num_triplets)

        anchors.extend(outputs[torch.tensor(anchor_choices)])
        positives.extend(outputs[torch.tensor(positive_choices)])
        negatives.extend(outputs[torch.tensor(negative_choices)])

    anchors = torch.stack(anchors)
    positives = torch.stack(positives)
    negatives = torch.stack(negatives)

    return anchors, positives, negatives


def train_clusters(data, model: DynamicUmap, focus_ids):
    """ train function clusters, trains dynamic umap to cluster labels using TripletMarginLoss"""
    # create data loader
    dataset = CustomDataset(data)
    dataloader = DataLoader(dataset, batch_size=64, shuffle=True)

    # right now only for dynamic umap
    # TODO add get neural net:
    neural_net = model._model.model.encoder

    optimizer = optim.Adam(params=neural_net.parameters(), lr=0.0002)
    triplet_loss = nn.TripletMarginLoss(margin=1.0, p=2)
    for batch in tqdm(dataloader):
        outputs = neural_net(batch["embedding"])
        anchors, positives, negatives = form_triplets(outputs, batch["label"])
        loss = triplet_loss(anchors, positives, negatives)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    model._model.model.encoder = neural_net
    return model


class CustomDatasetPoint(Dataset):
    def __init__(self, dataframe):
        self.dataframe = dataframe

    def __len__(self):
        return len(self.dataframe)

    def __getitem__(self, idx):
        if torch.is_tensor(idx):
            idx = idx.tolist()
        embedding = torch.tensor(
            self.dataframe.iloc[idx]["embedding"], dtype=torch.float32
        )
        label = torch.tensor(self.dataframe.iloc[idx]["label"], dtype=torch.long)
        id = torch.tensor(self.dataframe.iloc[idx]["id"], dtype=torch.long)

        sample = {"id": id, "embedding": embedding, "label": label}

        return sample


def custom_loss(output, target_dicts, original, lam=0.1):
    """ custom loss for correction training, makes sure the loss also grows when non corrected points move etc."""
    # Initialize MSE loss function
    mse_loss = nn.MSELoss()

    # Extract the IDs and positions from the target list of dictionaries
    target_ids = [d["batch_idx"] for d in target_dicts]
    target_pos = [d["pos"] for d in target_dicts]

    # Create tensors from the extracted values
    target_ids_tensor = torch.tensor(target_ids, dtype=torch.long)
    target_pos_tensor = torch.tensor(target_pos, dtype=output.dtype)

    # Gather the corresponding output values using the IDs
    selected_output = torch.index_select(output, 0, target_ids_tensor)
    # Calculate MSE loss for selected indices
    if selected_output.nelement() == 0 or target_pos_tensor.nelement() == 0:
        mse_loss_selected = torch.tensor(0.0, dtype=output.dtype).to(output.device)
    else:
        # Calculate MSE loss for selected indices
        mse_loss_selected = mse_loss(selected_output, target_pos_tensor)
    # Create a mask to find indices that are NOT in the target list
    full_indices = torch.arange(output.size(0))
    mask_non_target = torch.ones(output.size(0), dtype=torch.bool)
    mask_non_target[target_ids_tensor] = 0

    non_target_indices = full_indices[mask_non_target]

    # Gather the corresponding original and output values using the non-target IDs
    selected_original = torch.index_select(original, 0, non_target_indices)
    selected_output_non_target = torch.index_select(output, 0, non_target_indices)

    # Calculate MSE loss for non-target indices with regularization
    mse_loss_non_target = mse_loss(selected_output_non_target, selected_original)
    # Combine both losses with lambda
    total_loss = mse_loss_selected + lam * mse_loss_non_target

    return total_loss


def collate_fn(batch, corrections):
    """ custom collate function to also pass on only the necessary corrections, and handle data shuffeling (keep track of ids)"""
    relevant_corrections = []
    batch_dict = {k: np.array([dic[k] for dic in batch]) for k in batch[0]}

    for idx, item in enumerate(batch):
        for correction in corrections:
            if correction["id"] == item.get("id"):
                correction["batch_idx"] = idx
                relevant_corrections.append(correction)
    return {
        "id": batch_dict["id"],
        "embedding": torch.stack(batch_dict["embedding"].tolist()),
        "label": batch_dict["label"],
        "corrections": relevant_corrections,
    }


def train_points_epochs(data, epochs, dyn_red_model, correction):
    """ train the correction of points """
    neural_net = dyn_red_model._model.model.encoder
    optimizer = optim.Adam(params=neural_net.parameters(), lr=0.00005)
    dataset = CustomDatasetPoint(data)
    dataloader = DataLoader(
        dataset,
        batch_size=32,
        shuffle=True,
        collate_fn=lambda batch: collate_fn(batch, correction),
    )
    original = {}

    for batch in dataloader:
        embeddings = neural_net(batch["embedding"]).detach()
        for idx, embedding in zip(batch["id"], embeddings):
            original[idx] = embedding
    for epoch in range(epochs):
        logger.info(f"Training epoch {epoch}")
        for i, batch in tqdm(enumerate(dataloader)):
            outputs = neural_net(batch["embedding"])
            # alpha = 0.95
            # original[i] = alpha * original[i] + (1 - alpha) * outputs.detach()
            # print(original[i].shape, outputs.shape, batch["corrections"])
            current_originals = torch.stack([original[idx] for idx in batch["id"]])
            loss = custom_loss(outputs, batch["corrections"], current_originals, 1)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
    dyn_red_model._model.model.encoder = neural_net
    return dyn_red_model


def delete_old_reduced_embeddings(db, dyn_red_entry):
    """ delete old reduced embeddings, for speedup, delete connected clusters manually"""
    with Timer("delete old reduced embeddings"):
        db.query(Cluster).filter(
            Cluster.reduced_embedding_id.in_(
                db.query(ReducedEmbedding.embedding_id).filter(
                    ReducedEmbedding.model_id == dyn_red_entry.model_id
                )
            )
        ).delete(synchronize_session=False)
        db.query(ReducedEmbedding).filter(
            ReducedEmbedding.model_id == dyn_red_entry.model_id
        ).delete(synchronize_session=False)
        db.commit()


def extract_embeddings_reduced(project, dyn_red_model, db):
    """ this function handles the model saving and re-calculation of reduced embeddings after training """
    with Timer("add new reduced embeddings"):
        project.save_model("reduction_config", dyn_red_model)
        extract_embeddings_reduced_endpoint(project.project_id, db=db)
