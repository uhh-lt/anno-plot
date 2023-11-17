import logging
import time

from sqlalchemy import and_
from sqlalchemy.dialects.postgresql import insert

from db.models import Code, Dataset, Project, Segment, Sentence

logger = logging.getLogger(__name__)


def text_to_json(input_text, options=None):
    # Split text by double newlines to separate sentences
    sentences = input_text.strip().split(options.sentence_split)
    results = []

    for sentence in sentences:
        lines = sentence.split("\n")
        lines = [line for line in lines if not line.strip().startswith("#")]
        # Extract the words and labels from each line
        words = [line.split(options.split)[options.word_idx].strip() for line in lines]

        labels = [line.split(options.split)[options.label_idx].strip() for line in lines]

        # Construct the sentence
        text = " ".join(words)
        if options.type == "plain":
            entities = []
            start_pos = 0
            in_entity = False
            entity_label = ""
            for i, (word, label) in enumerate(zip(words, labels)):
                if label != "O":
                    # If we are already in an entity, we close it first
                    if not in_entity:
                        start = start_pos
                        entity_label = label
                        in_entity = True
                    elif entity_label != label:
                        entities.append(
                            {"start": start, "end": start_pos - 1, "label": entity_label}
                        )
                        start = start_pos
                        entity_label = label
                else:
                    if in_entity:
                        entities.append(
                            {"start": start, "end": start_pos - 1, "label": entity_label}
                        )
                        in_entity = False
                start_pos += len(word) + 1
            if in_entity:
                entities.append(
                    {"start": start, "end": start_pos - 1, "label": entity_label}
                )

            results.append({"text": text, "entities": entities})

        if options.type == "B-I-O":
            entities = []
            start_pos = 0
            in_entity = False
            for i, (word, label) in enumerate(zip(words, labels)):
                if label.startswith("B-"):
                    # If we are already in an entity, we close it first
                    if in_entity:
                        entities.append(
                            {"start": start, "end": start_pos - 1, "label": entity_label}
                        )

                    # Start of a new entity
                    start = start_pos
                    entity_label = label[2:]
                    in_entity = True
                elif label.startswith("I-") and not in_entity:
                    # Continuation of an entity but we missed the beginning
                    start = start_pos
                    entity_label = label[2:].split(options.label_split)
                    in_entity = True
                elif label.startswith("O") and in_entity:
                    # End of the current entity
                    entities.append(
                        {"start": start, "end": start_pos - 1, "label": entity_label}
                    )
                    in_entity = False

                start_pos += len(word) + 1  # +1 for the space

            # If the last word was part of an entity
            if in_entity:
                entities.append(
                    {"start": start, "end": start_pos - 1, "label": entity_label}
                )

            results.append({"text": text, "entities": entities})
    if options.label_split:
        for item in results:
            for entity in item["entities"]:
                entity["label"] = entity["label"].split(options.label_split)
    return {"data": results}


def add_data_to_db(project_id, database_name, json_data, session):
    start_time = time.time()
    project = (
        session.query(Project).filter(and_(Project.project_id == project_id)).first()
    )
    if not project:
        raise Exception("Project not found in the database!")

    dataset = Dataset(
        project_id=project.project_id,
        dataset_name=database_name,
    )
    session.add(dataset)
    session.commit()

    sentence_dicts = [
        {"text": item["text"], "dataset_id": dataset.dataset_id, "position_in_dataset": i}
        for i, item in enumerate(json_data["data"])
    ]

    insert_stmt = insert(Sentence).values(sentence_dicts).returning(Sentence.sentence_id)
    sentence_ids = [row[0] for row in session.execute(insert_stmt).fetchall()]

    segment_dicts = []
    codes_dict = {
        (a.text, a.parent_code_id): a
        for a in session.query(Code).filter_by(project_id=project.project_id).all()
    }
    new_codes = set()

    for item, sentence_id in zip(json_data["data"], sentence_ids):
        for entity in item["entities"]:
            labels = entity["label"]
            if not isinstance(labels, list):
                labels = [labels]
            last_id = None
            for i, label in enumerate(labels):
                code = codes_dict.get((label, last_id))
                code_id = code.code_id if code else None
                # If the code doesn't exist, add it to the database and the dictionary
                if code is None or code.parent_code_id != last_id:
                    if (label, last_id) not in new_codes:
                        new_code = Code(
                            text=label,
                            project_id=project.project_id,
                            parent_code_id=last_id,
                        )
                        session.add(new_code)
                        session.commit()
                        code_id = new_code.code_id
                        codes_dict[(label, last_id)] = new_code
                        new_codes.add((label, last_id))

                last_id = code_id

            segment_dict = {
                "sentence_id": sentence_id,
                "text": item["text"][entity["start"] : entity["end"]],
                "start_position": entity["start"],
                "code_id": code_id,
            }

            segment_dicts.append(segment_dict)

    if segment_dicts:
        session.bulk_insert_mappings(Segment, segment_dicts)

    session.commit()
    session.close()

    segment_time = time.time()

    logger.info(f"Added {len(json_data['data'])} sentences to the database.")
    logger.info(
        f"Adding the data to the database took {time.time() - start_time} seconds."
    )
