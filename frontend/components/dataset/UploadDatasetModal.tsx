import { Button, FormControlLabel, FormGroup, Modal, Switch, TextField } from "@mui/material";
import React, { useState } from "react";
import { uploadAdvancedDataset, uploadDataset } from "@/pages/api/api";

/**
 * This component displays a modal for uploading datasets, providing both basic and advanced settings.
 */

interface CategoryModalProps {
  open: boolean;
  handleClose: () => void;
  projectId: number;
  updateDatasets: () => void;
  setLoading: (loaded: boolean) => void;
  setSuccess: (exportSuccess: boolean) => void;
}

export default function UploadModal(props: CategoryModalProps) {
  const [datasetName, setDatasetName] = useState<string>("");
  const [split, setSplit] = useState("\\t");
  const [sentenceSplit, setSentenceSplit] = useState("\\n\\n");
  const [wordIdx, setWordIdx] = useState(0);
  const [labelIdx, setLabelIdx] = useState(1);
  const [labelSplit, setLabelSplit] = useState("-");
  const [type, setType] = useState("plain");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [advancedSettingsSelected, setAdvancedSettingsSelected] = useState(false);

  const handleDatasetNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDatasetName(event.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFinish = () => {
    props.handleClose();
    props.setLoading(true);

    if (!advancedSettingsSelected) {
      uploadDataset(props.projectId, datasetName, selectedFile!).then(() => {
        props.setLoading(false);
        props.setSuccess(true);
        props.updateDatasets();
      });
    } else {
      uploadAdvancedDataset(
        props.projectId,
        datasetName,
        selectedFile!,
        encodeURIComponent(split),
        encodeURIComponent(sentenceSplit),
        wordIdx,
        labelIdx,
        encodeURIComponent(labelSplit),
        encodeURIComponent(type),
      ).then(() => {
        props.setLoading(false);
        props.setSuccess(true);
        props.updateDatasets();
      });
    }
  };

  function setClosed() {
    props.handleClose();
    setDatasetName("");
    setAdvancedSettingsSelected(false);
    setSplit("\\t");
    setSentenceSplit("\\n\\n");
    setWordIdx(0);
    setLabelIdx(1);
    setLabelSplit("None");
    setType("plain");
  }

  return (
    <>
      <Modal open={props.open} onClose={setClosed}>
        <div className="relative w-fit bg-white p-5 rounded-lg shadow mx-auto mt-[10vh] grid-cols-1 text-center">
          <div className="my-5">
            <TextField className="w-[25rem]" id="standard-basic" label="Project ID" value={props.projectId} disabled />

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
                  label="word_idx"
                  type="number"
                  value={wordIdx}
                  onChange={(e) => setWordIdx(parseInt(e.target.value, 10))}
                />
              </div>
              <div className="my-2">
                <TextField
                  className="w-[25rem]"
                  id="standard-basic"
                  label="label_idx"
                  type="number"
                  value={labelIdx}
                  onChange={(e) => setLabelIdx(parseInt(e.target.value, 10))}
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
                <TextField
                  className="w-[25rem]"
                  id="standard-basic"
                  label="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                />
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
