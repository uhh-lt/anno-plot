import {Button, FormControlLabel, FormGroup, Modal, Select, Switch, TextField} from "@mui/material";
import React, {useContext, useState} from "react";
import { uploadAdvancedDataset, uploadDataset } from "@/api/api";
import {AppContext} from "@/context/AppContext";
import MenuItem from "@mui/material/MenuItem";

/**
 * This component displays a modal for uploading datasets, providing both basic and advanced settings.
 */

interface CategoryModalProps {
  open: boolean;
  handleClose: () => void;
  updateDatasets: () => void;
  setLoading: (loaded: boolean) => void;
  setSuccess: (exportSuccess: boolean) => void;
}

export default function UploadModal(props: CategoryModalProps) {
  const {currentProject, fetchProject, setLoading} = useContext(AppContext);
  const [datasetName, setDatasetName] = useState<string>("");
  const [split, setSplit] = useState("\\t");
  const [sentenceSplit, setSentenceSplit] = useState("\\n\\n");
  const [wordIdx, setWordIdx] = useState(0);
  const [labelIdx, setLabelIdx] = useState(1);
  const [labelSplit, setLabelSplit] = useState("-");
  const [type, setType] = useState("plain");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [advancedSettingsSelected, setAdvancedSettingsSelected] = useState(false);
  const [rawWordInput, setRawWordInput] = useState("0");
    const [rawLabelInput, setRawLabelInput] = useState("1");

  const handleDatasetNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDatasetName(event.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFinish = async () => {
    props.handleClose();
    props.setLoading(true);
    setLoading(true);
    if (!advancedSettingsSelected) {
      await uploadDataset(currentProject, datasetName, selectedFile!);
    } else {
      await uploadAdvancedDataset(
          currentProject,
          datasetName,
          selectedFile!,
          encodeURIComponent(split),
          encodeURIComponent(sentenceSplit),
          wordIdx,
          labelIdx,
          encodeURIComponent(labelSplit),
          encodeURIComponent(type),
      );
    }
    props.setLoading(false);
    props.setSuccess(true);
    props.updateDatasets();
    await fetchProject();
  };

  function setClosed() {
    props.handleClose();
    setDatasetName("");
    setAdvancedSettingsSelected(false);
    setSplit("\\t");
    setSentenceSplit("\\n\\n");
    setWordIdx(0);
    setLabelIdx(1);
    setLabelSplit("-");
    setType("plain");
  }

  return (
    <>
      <Modal open={props.open} onClose={setClosed}>
        <div className="relative w-fit bg-white p-5 rounded-lg shadow mx-auto mt-[10vh] grid-cols-1 text-center">
          <div className="my-5">
            <TextField className="w-[25rem]" id="standard-basic" label="Project ID" value={currentProject} disabled />

            <TextField
              className="w-[25rem]"
              id="standard-basic"
              label="Dataset Name"
              value={datasetName}
              onChange={handleDatasetNameChange}
            />
          </div>
          <div className="mt-10 w-fit mx-auto">
            <form>
              <Button variant="contained" component="label">
                Select file
                <input hidden accept=".txt" type="file" onChange={handleFileChange} />
              </Button>
            </form>
            {selectedFile && <p>Selected File: {selectedFile.name}</p>}
          </div>
          <div className="w-fit mx-auto">
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={advancedSettingsSelected}
                    onChange={() => setAdvancedSettingsSelected(!advancedSettingsSelected)}
                  />
                }
                label="Advanced Settings"
              />
            </FormGroup>
          </div>
          {advancedSettingsSelected && (
            <div className="my-5 overflow-auto h-72 grid-cols-2">
              <div className="my-2">
                <TextField
                  className="w-[25rem]"
                  id="standard-basic"
                  label="split"
                  value={split}
                  onChange={(e) => setSplit(e.target.value)}
                />
              </div>
              <div className="my-2">
                <TextField
                  className="w-[25rem]"
                  id="standard-basic"
                  label="sentence_split"
                  value={sentenceSplit}
                  onChange={(e) => setSentenceSplit(e.target.value)}
                />
              </div>
                            <div className="my-2">
                <TextField
  className="w-[25rem]"
  id="standard-basic"
  label="label_idx"
  type="number"
  value={rawLabelInput}
  onChange={(e) => {
    const value = e.target.value;
    console.log(value);
    setRawLabelInput(value);
    setLabelIdx(value === '' ? 0 : parseInt(value, 10));
  }}
/>
                              </div>
              <div className="my-2">
                <TextField
  className="w-[25rem]"
  id="standard-basic"
  label="word_idx"
  type="number"
  value={rawWordInput}
  onChange={(e) => {
    const value = e.target.value;
    console.log(value);
    setRawWordInput(value);
    setWordIdx(value === '' ? 0 : parseInt(value, 10));
  }}
/>
              </div>
              <div className="my-2">
                <TextField
                  className="w-[25rem]"
                  id="standard-basic"
                  label="label_split"
                  value={labelSplit}
                  onChange={(e) => setLabelSplit(e.target.value)}
                />
              </div>
              <div className="my-2">
                <Select
                  labelId="type-select-label"
                  id="standard-basic"
                  value={type}
                  label="Type"
                  onChange={(event)=> setType(event.target.value as string)}
                >
                  <MenuItem value="plain">Plain</MenuItem>
                  <MenuItem value="B-I-O">B-I-O</MenuItem>
                </Select>
              </div>
            </div>
          )}
          <div className="block h-12" />
          <div className="absolute bottom-3 right-3 w-fit mx-auto">
            <Button className="mx-2" variant="outlined" onClick={setClosed}>
              Cancel
            </Button>
            <Button
              className="mx-2"
              variant="contained"
              component="label"
              onClick={handleFinish}
              disabled={!(datasetName != "" && selectedFile != null)}
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
