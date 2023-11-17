import React, { useState, useEffect } from "react";
import { getSentences, getDatasets } from "@/pages/api/api";
import Header from "@/components/Header";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
} from "@mui/material";

type Sentence = {
  sentence_id: number;
  text: string;
  segments: { start_position: number; text: string }[];
};

/**
 *  Data page used to display sentences of an uploaded dataset
 */
export default function SentencesPage() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [projectId, setProjectId] = useState(
    typeof window !== "undefined" ? parseInt(localStorage.getItem("projectId") ?? "1") : 1,
  );
  const [datasetId, setDatasetId] = useState<number | undefined>(undefined); // Add datasetId state

  const fetchAndUpdateSentences = async (page: number, pageSize: number) => {
    try {
      // Fetch sentences based on projectId and datasetId
      if (datasetId !== undefined) {
        const sentenceResponse: any = await getSentences(projectId, datasetId, page, pageSize);
        const sentenceArray: Sentence[] = sentenceResponse.data.data;
        const sentenceCount = sentenceResponse.data.count;

        setSentences(sentenceArray);
        setTotalCount(sentenceCount);
      }
    } catch (error) {
      console.error("Error fetching sentences:", error);
    }
  };

  useEffect(() => {
    fetchAndUpdateSentences(currentPage, pageSize);
  }, [currentPage, pageSize, datasetId]); // Include datasetId in the dependency array

  useEffect(() => {
    // Fetch the list of available datasets and set the initial datasetId
    const fetchDatasets = async () => {
      try {
        const datasetResponse: any = await getDatasets(projectId);
        const datasetArray: any = datasetResponse.data;
        setDatasets(datasetArray);
        if (datasetArray.length > 0) {
          setDatasetId(datasetArray[0].dataset_id); // Set the initial datasetId to the first available dataset
        }
      } catch (error) {
        console.error("Error fetching datasets:", error);
      }
    };
    fetchDatasets();
  }, [projectId]);

  const nextPage = () => {
    if (currentPage < Math.ceil(totalCount / pageSize) - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  function HighlightAnnotatedWords({
    sentence,
    segments,
  }: {
    sentence: string;
    segments: { start_position: number; text: string }[];
  }) {
    // Function to split the sentence into words and apply highlights
    const splitSentenceWithHighlights = () => {
      let currentPosition = 0;
      let sentenceWords = [];

      if (segments?.length > 0) {
        // Sort segments by start_position
        const sortedSegments = segments.sort(
          (a: { start_position: number }, b: { start_position: number }) => a.start_position - b.start_position,
        );

        for (const segment of sortedSegments) {
          // Add words before the segment
          const segmentText = segment.text;
          if (segment.start_position > currentPosition) {
            const beforeSegmentText = sentence.slice(currentPosition, segment.start_position);
            sentenceWords.push({ text: beforeSegmentText, highlighted: false });
            currentPosition = segment.start_position;
          }

          // Add the annotated segment with a yellow background
          sentenceWords.push({ text: segmentText, highlighted: true });
          currentPosition += segmentText.length;
        }
      } else {
        // If there are no segments, add the entire sentence as a single word
        sentenceWords.push({ text: sentence, highlighted: false });
      }

      // Add any remaining words after the last segment
      if (currentPosition < sentence.length) {
        const remainingText = sentence.slice(currentPosition);
        sentenceWords.push({ text: remainingText, highlighted: false });
      }

      return sentenceWords;
    };

    const sentenceWords = splitSentenceWithHighlights();

    return (
      <div>
        {sentenceWords.map((word: { text: string; highlighted: boolean }, index: number) => (
          <span key={index} style={{ backgroundColor: word.highlighted ? "yellow" : "transparent" }}>
            {word.text}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div>
      <Header title="Sentences Data" />
      <div className="flex justify-center my-4">
        {/* Dropdown menu to select datasetId */}
        <Select
          value={datasetId || ""}
          onChange={(e) => setDatasetId(Number(e.target.value) || undefined)}
          className="mr-2 h-fit w-fit my-auto"
        >
          {datasets.map((dataset) => (
            <MenuItem key={dataset.dataset_id} value={dataset.dataset_id}>
              {dataset.dataset_name}
            </MenuItem>
          ))}
        </Select>
        <Button variant="outlined" className="mx-2 h-fit w-fit my-auto" onClick={prevPage} disabled={currentPage === 0}>
          Previous Page
        </Button>
        <Button
          variant="outlined"
          className="mx-2 h-fit w-fit my-auto"
          onClick={nextPage}
          disabled={currentPage === Math.ceil(totalCount / pageSize) - 1}
        >
          Next Page
        </Button>
        <select value={pageSize} onChange={(e) => changePageSize(Number(e.target.value))} className="ml-2">
          <option value={100}>Page Size: 100</option>
          <option value={50}>Page Size: 50</option>
          <option value={25}>Page Size: 25</option>
        </select>
        <input
          type="number"
          value={currentPage}
          onChange={(e) => {
            const enteredValue = parseInt(e.target.value, 10);
            if (!isNaN(enteredValue)) {
              setCurrentPage(enteredValue);
            } else {
              // Handle empty input by setting it to 0
              setCurrentPage(0);
            }
          }}
          className="ml-2 p-1 w-16"
        />
        <span className="h-fit my-auto">/ {Math.ceil(totalCount / pageSize)}</span>
      </div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sentence ID</TableCell>
              <TableCell>Text with Marked Words</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sentences.map((item: Sentence) => (
              <TableRow key={item.sentence_id}>
                <TableCell>{item.sentence_id}</TableCell>
                <TableCell>
                  <HighlightAnnotatedWords sentence={item.text} segments={item.segments} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
