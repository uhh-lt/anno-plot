import { Button, FormControl, FormControlLabel, FormLabel, Modal, Radio, RadioGroup, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { addCodeToSegment, getCodesRoutes } from "@/pages/api/api";

/**
 * This component represents a modal for changing the code associated with a segment. It allows users
 * to search for and select a new code for the segment.
 */

interface AddToCodeModalProps {
  open: boolean;
  handleClose: () => void;
  projectId: number;
  segmentId: number;
}

function findCodePath(tree, code_id) {
  let currentNode = tree.find(node => node.code_id === code_id);
  if (!currentNode) {
    return null; // the given code_id doesn't exist in the tree
  }

  let path = currentNode.text;

  // Traverse up the tree to get the path
  while (currentNode && currentNode.parent_code_id !== null) {
    currentNode = tree.find(node => node.code_id === currentNode.parent_code_id);
    if (currentNode) {
      path = currentNode.text + "-" + path;
    }
  }

  return path;
}

export default function ChangeCodeModal(props: AddToCodeModalProps) {
  const [checkedId, setCheckedId] = React.useState(null);
  const [codeList, setCodeList] = React.useState<any[]>([]);

  useEffect(() => {
    getCodesRoutes(props.projectId)
      .then((response) => {
        setCodeList(response.data.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  function handleCheckboxChange(selectedLabel: number) {
    setCheckedId(selectedLabel);
  }

  function setClosed() {
    props.handleClose();
  }

    function pressAddButton() {
            try {
                console.log("try changing code")
                console.log(checkedId)
                console.log(props)
                if (checkedId != null) {
                    addCodeToSegment(props.segmentId, props.projectId, checkedId).then(() => window.location.reload());
                }
            } catch (e) {
                console.error("Error adding code:", e);
            }
        setClosed();
        //props.handleClose();
        //window.location.reload(); // Reload the page
    }

  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredCodeList = codeList.filter((code) => code.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  useEffect(() => {
    if (!props.open) {
      setSearchQuery("");
    }
  }, [props.open]);

  return (
    <>
      <Modal open={props.open} onClose={setClosed}>
        <div className="relative w-fit bg-white p-5 rounded-lg shadow mx-auto mt-[10rem]">
          <div className="mt-5 w-fit mx-auto">
            <FormControl component="fieldset">
              <FormLabel component="legend">Add to Category</FormLabel>
              <div className="overflow-auto h-[25vw]">
                <TextField
                  className="w-[25rem]"
                  id="search"
                  label="Search"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                />
                <RadioGroup aria-label="Select Category" name="select" value={"Select a Category for the Segment"}>
                  {filteredCodeList != null &&
                    filteredCodeList.map((code) => (
                      <FormControlLabel
                        value={code.code_id}
                        control={<Radio />}
                        label={findCodePath(codeList, code.code_id)}
                        key={code.code_id}
                        checked={checkedId === code.code_id}
                        onChange={() => handleCheckboxChange(code.code_id)}
                      />
                    ))}
                </RadioGroup>
              </div>
            </FormControl>
          </div>
          <div className="block h-20" />
          <div className="absolute bottom-2 right-2">
            <Button className="mx-2" variant="outlined" onClick={setClosed}>
              Cancel
            </Button>
            <Button className="mx-2 bg-blue-900" variant="contained" onClick={pressAddButton}>
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
