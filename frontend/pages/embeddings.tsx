import React, { useState, useEffect } from "react";
import { getEmbeddings, extractEmbeddings } from "@/pages/api/api";
import Header from "@/components/Header";
import { getCoreRowModel, ColumnDef, flexRender, useReactTable } from "@tanstack/react-table";
import { Button, TextField, CircularProgress } from "@mui/material";
import { BsListColumnsReverse } from "react-icons/bs";
import CheckIcon from "@mui/icons-material/Check";
import { Checkbox, FormControlLabel } from "@mui/material";

type Embedding = {
  id: string;
  embedding: number[];
};

/**
 * Data page used to display embeddings with the possibility to export them
 */
export default function DatabasesPage() {
  const [embeddings, setEmbeddings] = useState<Embedding[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [reducedLength, setReducedLength] = useState(3);
  const [totalCount, setTotalCount] = useState(0);
  const [projectId, setProjectId] = useState(
    typeof window !== "undefined" ? parseInt(localStorage.getItem("projectId") ?? "1") : 1,
  );
  const [loading, setLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [batchSize, setBatchSize] = useState(124);
  const [use_disk_storage, setUseDiskStorage] = useState(false);

  const embeddings_columns: ColumnDef<Embedding>[] = [
    {
      header: "Embedding",
      footer: (props) => props.column.id,
      columns: [
        {
          accessorFn: (row) => row.id,
          id: "id",
          cell: (info) => info.getValue(),
          header: () => <span>ID</span>,
          footer: (props) => props.column.id,
        },
        {
          accessorFn: (row) => row.embedding,
          id: "embedding",
          cell: (info) => info.getValue().toString(),
          header: () => <span>Embedding</span>,
          footer: (props) => props.column.id,
        },
      ],
    },
  ];

  const embeddings_table = useReactTable({
    columns: embeddings_columns,
    data: embeddings,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });

  const fetchAndUpdateEmbeddings = async (page: number, pageSize: number) => {
    let all = false;
    try {
      const embeddingsResponse: any = await getEmbeddings(projectId, all, page, pageSize, reducedLength);
      const embeddingsData: Embedding[] = embeddingsResponse.data.data;
      const totalCount = embeddingsResponse.data.count;

      setEmbeddings(embeddingsData);
      setTotalCount(totalCount);
    } catch (error) {
      console.error("Error fetching embeddings:", error);
    }
  };

  useEffect(() => {
    setProjectId(parseInt(localStorage.getItem("projectId") ?? "1"));
    fetchAndUpdateEmbeddings(currentPage, pageSize);
  }, [currentPage, pageSize, reducedLength]);

  const handleExtractEmbeddings = async () => {
    setLoading(true);
    setExportSuccess(false);
    try {
      await extractEmbeddings(projectId, batchSize, use_disk_storage);
      fetchAndUpdateEmbeddings(currentPage, pageSize);
      setExportSuccess(true);
    } catch (error) {
      console.error("Error extracting embeddings:", error);
    } finally {
      setLoading(false);
    }
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

  // Function to update reducedLength
  const handleReducedLengthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReducedLength(Number(event.target.value));
  };

  return (
    <header>
      <Header title="Embeddings Data" />
      <div className="flex justify-center">
        <TextField
          label="Batch Size"
          variant="outlined"
          type="number"
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          className="mr-2"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={use_disk_storage}
              onChange={(e) => setUseDiskStorage(e.target.checked)}
              color="primary"
            />
          }
          label="Use Disk Storage"
          className="mr-2"
        />

        <Button
          variant="outlined"
          component="label"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleExtractEmbeddings()}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : exportSuccess ? (
            <CheckIcon style={{ color: "green", marginRight: "8px" }} />
          ) : (
            <BsListColumnsReverse className="mr-2" />
          )}
          Export Embeddings
        </Button>
      </div>

      {/* Pagination controls */}

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
      </div>
      {/* Input field for reduced_length */}
      <div className="flex justify-center mt-4">
        <TextField
          label="Reduced Length"
          variant="outlined"
          type="number"
          value={reducedLength}
          onChange={handleReducedLengthChange}
        />
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
      <div className="text-center mt-2">Total Count: {totalCount}</div>
      <div className="p-2 block max-w-full overflow-x-scroll overflow-y-hidden">
        <div className="h-2" />
        <table className="w-full ">
          <thead>
            {embeddings_table.getHeaderGroups().map((headerGroup) => (
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
            {embeddings_table.getRowModel().rows.map((row) => {
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
