import { searchCodeOccurrences } from "@/pages/api/api";
import React, { useState } from "react";
import { useReactTable, ColumnDef, getCoreRowModel, flexRender } from "@tanstack/react-table";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import { Modal, TextField } from "@mui/material";

/**
 * This component displays a modal for searching code occurrences in a project.
 */

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

interface SearchModalProps {
  open: boolean;
  handleClose: () => void;
  projectId: number;
  codeId: number;
}

// onSearch: (project_id: number, config_id: number, searchQuery: string) => Promise<any>;
export default function SearchCodeOccurrencesModal(props: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [plots, setPlots] = useState<Plot[]>([]);

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

  function setClosed() {
    setSearchQuery("");

    props.handleClose();
  }

  const handleCodeSearch = async () => {
    try {
      let limit = 100;
      const response = await searchCodeOccurrences(props.projectId, props.codeId, searchQuery, limit);
      const response_data = response.data.data;

      setPlots(response_data);

      setSearchQuery("");
    } catch (error) {
      // Handle error
    }
  };

  return (
    <Modal open={props.open} onClose={setClosed}>
      <div className="w-fit bg-white p-5 rounded-lg shadow mx-auto mt-[10vh] grid-cols-1 text-center">
        <div className="flex items-center justify-center mt-2">
          {/* Searchs */}
          <div className="flex items-center">
            <TextField
              label="Search Segments"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              className="ml-2"
            />
            <IconButton color="primary" onClick={handleCodeSearch}>
              <SearchIcon />
            </IconButton>
          </div>
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
      </div>
    </Modal>
  );
}
