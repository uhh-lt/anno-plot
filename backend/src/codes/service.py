"""
This module provides utility functions for working with category trees in the context of a database.
It includes functions for building a category tree from a list of codes and checking for circular dependencies.
"""

import logging
from db import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Build a hierarchical category tree structure from a list of codes
def build_category_tree(codes):
    category_tree = {}
    mapper = {}
    for code in codes:
        temp_code = {
            "id": code.code_id,
            "name": code.text,
            "subcategories": {},
        }
        mapper[code.code_id] = temp_code
    for code in codes:
        if code.parent_code_id is not None:
            mapper[code.parent_code_id]["subcategories"][code.code_id] = mapper[
                code.code_id
            ]
        else:
            category_tree[code.code_id] = mapper[code.code_id]
    return category_tree

# Check for circular dependencies in the category tree
def has_circular_dependency(session, project_id, code_id, parent_code_id):
    visited = set()

    current_code_id = parent_code_id
    while current_code_id is not None:
        if current_code_id == code_id:
            return True

        if current_code_id in visited:
            return True

        visited.add(current_code_id)
        current_code = (
            session.query(models.Code)
            .filter(
                models.Code.project_id == project_id,
                models.Code.code_id == current_code_id,
            )
            .first()
        )

        if current_code is None:
            return False
        current_code_id = current_code.parent_code_id

    return False
