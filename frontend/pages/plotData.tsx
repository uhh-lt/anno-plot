import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useReactTable, ColumnDef, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { getPlots, searchSentence, searchCode, searchCluster, searchSegment, exportToFiles } from "@/pages/api/api";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileCopyIcon from "@mui/icons-material/FileCopy";

type Plot = {
  id: number;
  sentence: string;
  segment: string;
  code: number;
  reduced_embedding: {
    x: number;
    y: number;
  };
  cluster: number;
};

/**
 * Data page used to display info about plots such as the sentence, position, segment, code, and cluster
 */
export default function PlotsPage() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [searchText, setSearchText] = useState("");
  const [searchClusterId, setSearchClusterId] = useState(0);
  const [searchCodeId, setSearchCodeId] = useState(0);
  const [searchSegmentText, setSearchSegmentText] = useState("");
  const [exportSuccessDialogOpen, setExportSuccessDialogOpen] = useState(false);

  const [projectId, setProjectId] = useState(
    typeof window !== "undefined" ? parseInt(localStorage.getItem("projectId") ?? "1") : 1,
  );

  const plots_columns: ColumnDef<Plot>[] = [
    {
      header: "Plot",
      columns: [
        {
          accessorFn: (row) => row.id,
          id: "id",
          cell: (info) => info.getValue(),
          header: () => <span>ID</span>,
          maxSize: 5,
        },
        {
          accessorFn: (row) => row.sentence,
          id: "sentence",
          cell: (info) => info.getValue(),
          header: () => <span>Sentence</span>,
          minSize: 450,
        },
        {
          accessorFn: (row) => row.segment,
          id: "segment",
          cell: (info) => info.getValue(),
          header: () => <span>Segment</span>,
          minSize: 40,
        },
        {
          accessorFn: (row) => row.code,
          id: "code",
          cell: (info) => info.getValue(),
          header: () => <span>Code</span>,
          maxSize: 5,
        },
        {
          accessorFn: (row) => row.reduced_embedding.x,
          id: "reduced_embedding_x",
          cell: (info) => info.getValue(),
          header: () => <span>X</span>,
          maxSize: 5,
        },
        {
          accessorFn: (row) => row.reduced_embedding.y,
          id: "reduced_embedding_y",
          cell: (info) => info.getValue(),
          header: () => <span> Y</span>,
          maxSize: 5,
        },
        {
          accessorFn: (row) => row.cluster,
          id: "cluster",
          cell: (info) => info.getValue(),
          header: () => <span>Cluster</span>,
          maxSize: 5,
        },
      ],
    },
  ];

  const plots_table = useReactTable({
    columns: plots_columns,
    data: plots,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });

  const fetchAndUpdatePlots = async (page: number, pageSize: number) => {
    let all = false;
    try {
      const plotsResponse: any = await getPlots(projectId, all, page, pageSize);
      const plotArray: Plot[] = plotsResponse.data.data;
      const plotCount = plotsResponse.data.count;
      setPlots(plotArray);
      setTotalCount(plotCount);
    } catch (error) {
      console.error("Error fetching plots:", error);
    }
  };

  useEffect(() => {
    fetchAndUpdatePlots(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

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

  const handleSearch = async () => {
    try {
      const sentenceResponse: any = await searchSentence(projectId, searchText, pageSize);
      const plotArray: Plot[] = sentenceResponse.data.data;
      setPlots(plotArray);
    } catch (error) {
      console.error("Error searching for sentences:", error);
    }
  };

  const handleClusterSearch = async () => {
    try {
      const clusterResponse: any = await searchCluster(projectId, searchClusterId, pageSize);
      const clusterArray: Plot[] = clusterResponse.data.data;
      setPlots(clusterArray);
    } catch (error) {
      console.error("Error searching for clusters:", error);
    }
  };

  const handleCodeSearch = async () => {
    try {
      const codeResponse: any = await searchCode(projectId, searchCodeId, pageSize);
      const codeArray: Plot[] = codeResponse.data.data;
      setPlots(codeArray);
    } catch (error) {
      console.error("Error searching by code:", error);
    }
  };

  const handleSegmentSearch = async () => {
    try {
      const segmentResponse: any = await searchSegment(projectId, searchSegmentText, pageSize);
      const segmentArray: Plot[] = segmentResponse.data.data;
      setPlots(segmentArray);
    } catch (error) {
      console.error("Error searching by segment:", error);
    }
  };

  const handleRefresh = async () => {
    fetchAndUpdatePlots(currentPage, pageSize);
  };

  const handleCloseExportSuccessDialog = () => {
    // Close the success modal when the user clicks "Ok"
    setExportSuccessDialogOpen(false);
  };

  const handleExportFiles = async () => {
    try {
      const exportResponse: any = await exportToFiles(projectId);
      setExportSuccessDialogOpen(true);
    } catch (error) {
      console.error("Error exporting files:", error);
    }
  };

  return (
    <header>
      <Header title="Plot Data" />
      <div className="flex items-center justify-center mt-2">
        {/* Refresh Button */}
        <IconButton color="primary" onClick={handleRefresh}>
          <RefreshIcon />
        </IconButton>
        <IconButton color="primary" onClick={handleExportFiles}>
          <FileCopyIcon />
        </IconButton>
        <Dialog open={exportSuccessDialogOpen} onClose={handleCloseExportSuccessDialog}>
          <DialogTitle>Data extracted successfully</DialogTitle>
          <DialogContent>You can download the files in Databases Page</DialogContent>
          <DialogActions>
            <Button onClick={handleCloseExportSuccessDialog} color="primary" autoFocus>
              Ok
            </Button>
          </DialogActions>
        </Dialog>
        {/* Searchs */}
        <div className="flex items-center">
          <TextField
            label="Search Sentence"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            variant="outlined"
            className="ml-2"
          />
          <IconButton color="primary" onClick={handleSearch}>
            <SearchIcon />
          </IconButton>
        </div>
        <div className="flex items-center">
          <TextField
            label="Search Cluster"
            value={searchClusterId}
            onChange={(e) => setSearchClusterId(parseInt(e.target.value))}
            variant="outlined"
            className="ml-2"
          />
          <IconButton color="primary" onClick={handleClusterSearch}>
            <SearchIcon />
          </IconButton>
        </div>
        <div className="flex items-center">
          <TextField
            label="Search Code"
            value={searchCodeId}
            onChange={(e) => setSearchCodeId(parseInt(e.target.value))}
            variant="outlined"
            className="ml-2"
          />
          <IconButton color="primary" onClick={handleCodeSearch}>
            <SearchIcon />
          </IconButton>
        </div>
        <div className="flex items-center">
          <TextField
            label="Search Segment"
            value={searchSegmentText}
            onChange={(e) => setSearchSegmentText(e.target.value)}
            variant="outlined"
            className="ml-2"
          />
          <IconButton color="primary" onClick={handleSegmentSearch}>
            <SearchIcon />
          </IconButton>
        </div>
      </div>
      <div className="text-center mt-2">Total Count: {totalCount}</div>
      <div className="flex justify-center mt-4">
        <Button variant="outlined" className="mx-1" onClick={prevPage} disabled={currentPage === 0}>
          Previous Page
        </Button>
        <Button
          variant="outlined"
          className="mx-1"
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
      <div className="p-2 block max-w-full overflow-x-scroll overflow-y-hidden">
        <div className="h-2" />
        <table className="w-full ">
          <thead>
            {plots_table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ position: "relative", width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`resizer ${header.column.getIsResizing() ? "isResizing" : ""}`}
                        ></div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {plots_table.getRowModel().rows.map((row) => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td key={cell.id} style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </header>
  );
}
