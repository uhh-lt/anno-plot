import { Button, FormControl, FormControlLabel, FormLabel, Modal, Radio, RadioGroup, TextField } from "@mui/material";
import React, {useContext, useEffect, useState} from "react";
import {addCodeToParent, getCodesRoutes, updateCode} from "@/api/api";
import {AppContext} from "@/context/AppContext";
import {getPath} from "@/utilities";
/**
 * This component represents a modal for adding a code to a specific parent code. It provides the user
 * with options to search for a code and select a parent code.
 */

interface AddToCodeModalProps {
  open: boolean;
  handleClose: () => void;
  projectId: number;
  codeIds: [];
  setLoading: () => void;
}

export default function AddToCodeModal(props: AddToCodeModalProps) {
  const {setLoading, fetchCodes, codes, codeTree} = useContext(AppContext);
  const [checkedId, setCheckedId] = React.useState(0);
    const [searchQuery, setSearchQuery] = useState<string>("");


  useEffect(() => {
    setCheckedId(0);
  }, []);

  function handleCheckboxChange(selectedLabel: number) {
    setCheckedId(selectedLabel);
  }

  function setClosed() {
    props.handleClose();
  }

  async function pressAddButton() {
    setLoading(true);
    try {
      let parentCodeId = checkedId;
      if (checkedId === 0) {
        parentCodeId = -1;
      }
      for (const codeId of props.codeIds) {
        const response = await updateCode(props.projectId, codeId, null, parentCodeId, null);
      }

    } catch (e) {
      console.error("Error adding code:", e);
    }
    await fetchCodes();
    setLoading(false);
    setClosed();
  }
  const filteredCodeList = codes.filter((code) => code.text.toLowerCase().includes(searchQuery.toLowerCase()));

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
                <RadioGroup aria-label="Add to Category" name="add" value={"Add to Category"}>
                  {filteredCodeList != null &&
                    filteredCodeList.sort((a, b) => {
        const pathA = getPath(codes, a).toLowerCase();
        const pathB = getPath(codes, b).toLowerCase();
        if (pathA < pathB) return -1;
        if (pathA > pathB) return 1;
        return 0;
    }).map((code) => (
                      <FormControlLabel
                        value={code.code_id}
                        control={<Radio />}
                        label={getPath(codes, code)}
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
