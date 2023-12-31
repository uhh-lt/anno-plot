import { Button, FormControl, FormControlLabel, FormLabel, Modal, Radio, RadioGroup, TextField } from "@mui/material";
import React, {useContext, useEffect, useState} from "react";
import { getCodesRoutes, mergeCodes } from "@/api/api";
import {AppContext} from "@/context/AppContext";
import {getPath} from "@/utilities";
import Checkbox from '@mui/material/Checkbox';

/**
 * This component displays a modal for merging multiple codes. Users can select codes to merge and provide a new code name.
 */

interface MergeModalProps {
  open: boolean;
  handleClose: () => void;
  projectId: number;
  setLoading: () => void;
  selected: [];
}

export default function MergeModal(props: MergeModalProps) {
  const { setLoading, codes, codeTree, currentProject, fetchProject } = useContext(AppContext);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [disabled, setDisabled] = React.useState(true);
  const [inputValue, setInputValue] = React.useState("");

  useEffect(() => {
    if(props.selected)
    {
        console.log("selected", props.selected);
        setSelectedIds(props.selected);
    }
  }, []);

  function handleCheckboxChange(selectedLabel: number) {
    const updatedSelectedIds = [...selectedIds];
    const index = updatedSelectedIds.indexOf(selectedLabel);

    if (index === -1) {
        console.log("adding", selectedLabel)
      updatedSelectedIds.push(selectedLabel);
    } else {
      console.log("removing", selectedLabel)
      updatedSelectedIds.splice(index, 1);
    }
    setSelectedIds(updatedSelectedIds);
    setDisabled(updatedSelectedIds.length < 2 || inputValue === "");
  }

  function setClosed() {
    props.handleClose();
    setDisabled(true);
    setSelectedIds([]);
    setInputValue("");
  }

  async function pressMergeButton() {
    if (selectedIds.length < 2) {
      console.error("Select at least two codes to merge.");
      return;
    }
    setLoading(true);
    try {
      const mergeResponse = await mergeCodes(props.projectId, selectedIds, inputValue);
    } catch (e) {
      console.error("Error adding code:", e);
    }
    await fetchProject();
    setLoading(false);
    setClosed();
  }

  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredCodeList = codes.filter((code) => code.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setDisabled(selectedIds.length < 2 || inputValue === "");
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
          <div>
            <TextField
              className="w-[25rem]"
              id="standard-basic"
              label="New Category"
              value={inputValue}
              onChange={handleInputChange}
            />
          </div>
          <div className="mt-5 w-fit mx-auto">
            <FormControl component="fieldset">
              <FormLabel component="legend">Merge Categories</FormLabel>
              <div className="overflow-auto h-[25vw]">
                <TextField
                  className="w-[25rem]"
                  id="search"
                  label="Search"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                />
                <RadioGroup aria-label="Merge Categories" name="add" value={"Merge"}>
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
                        control={<Checkbox />}
                        label={getPath(codes, code)}
                        key={code.code_id}
                        checked={selectedIds.includes(code.code_id)}
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
            <Button disabled={disabled} className="mx-2 bg-blue-900" variant="contained" onClick={pressMergeButton}>
              Merge
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
