import React, { useState, useEffect } from "react";
import {
  getDatabaseInfos,
  deleteDatabaseTables,
  deleteDatabaseTable,
  downloadFile,
  listFiles,
  initTables,
} from "@/pages/api/api";
import Header from "@/components/Header";
import { getCoreRowModel, ColumnDef, flexRender, useReactTable } from "@tanstack/react-table";
import Delete from "@mui/icons-material/Delete";
import DeleteAllDatabasesModal from "@/components/database/DeleteDatabasesModal";
import DeleteDatabasesModal from "@/components/database/DeleteDatabaseModal";
import { Button } from "@mui/material";
import { BsTrash } from "react-icons/bs";
import { BsListColumnsReverse } from "react-icons/bs";
import DownloadIcon from "@mui/icons-material/Download";
type Database = {
  name: string;
  count: number;
};

type File = {
  name: string;
};

/**
 * Menu page used as an overview of existing databases and a possibility to create new databases or deleting all
 */
export default function DatabasesPage() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [databaseName, setDatabaseName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  const database_columns: ColumnDef<Database>[] = [
    {
      header: "Database",
      footer: (props) => props.column.id,
      columns: [
        {
          accessorFn: (row) => row.name,
          id: "name",
          cell: (info) => info.getValue(),
          header: () => <span>Name</span>,
          footer: (props) => props.column.id,
        },
        {
          accessorFn: (row) => row.count,
          id: "count",
          cell: (info) => info.getValue(),
          header: () => <span>Count</span>,
          footer: (props) => props.column.id,
        },
      ],
    },
    {
      header: "Actions",
      footer: (props) => props.column.id,
      columns: [
        {
          id: "delete",
          maxSize: 5,
          header: () => <span>Delete</span>,
          cell: (info) => (
            <div className="flex justify-center">
              <Delete
                className="cursor-pointer"
                onClick={() => {
                  setDatabaseName(info.row.original.name);
                  setDeleteModalOpen(true);
                }}
              />
            </div>
          ),
          footer: (props) => props.column.id,
        },
      ],
    },
  ];

  const file_columns: ColumnDef<File>[] = [
    {
      header: "Files",
      footer: (props) => props.column.id,
      columns: [
        {
          accessorFn: (row) => row.name,
          id: "path",
          cell: (info) => info.getValue(),
          header: () => <span>Path</span>,
          footer: (props) => props.column.id,
        },
      ],
    },
    {
      header: "Actions",
      footer: (props) => props.column.id,
      columns: [
        {
          id: "download",
          maxSize: 5,
          header: () => <span>Download</span>,
          cell: (info) => (
            <div className="flex justify-center">
              <DownloadIcon
                className="cursor-pointer"
                onClick={() => {
                  console.log("info.row.original.name", info.row.original.name);
                  setFilePath(info.row.original.name);
                  handleDownloadFile(info.row.original.name);
                }}
              />
            </div>
          ),
          footer: (props) => props.column.id,
        },
      ],
    },
  ];

  const database_table = useReactTable({
    columns: database_columns,
    data: databases,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });
  const file_tables = useReactTable({
    columns: file_columns,
    data: files,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });

  // Function to fetch and update database data
  const fetchAndUpdateDatabases = async () => {
    try {
      const databases: Database[] = (await getDatabaseInfos()).data;
      setDatabases(databases);
    } catch (error) {
      console.error("Error fetching databases:", error);
    }
  };

  const fetchAndUpdateFiles = async () => {
    try {
      const files: string[] = (await listFiles()).data.files;
      //transform files to json object with name
      let filesTransformed: any[] = [];
      for (let i = 0; i < files.length; i++) {
        let fileTransformed = {
          name: files[i],
        };
        filesTransformed.push(fileTransformed);
      }

      setFiles(filesTransformed);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchAndUpdateDatabases();
    fetchAndUpdateFiles();
  }, []);

  const handleDeleteDatabases = async () => {
    try {
      await deleteDatabaseTables();
      fetchAndUpdateDatabases();
      fetchAndUpdateFiles();
      setDeleteAllModalOpen(false);
    } catch (error) {
      console.error("Error deleting database:", error);
    } finally {
      window.location.reload();
    }
  };

  const handleDeleteDatabase = async (databaseName: string) => {
    try {
      await deleteDatabaseTable(databaseName);
      fetchAndUpdateDatabases();
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting database:", error);
    }
  };

  const handleDownloadFile = async (filePath: string) => {
    try {
      downloadFile(filePath);
      setDownloadModalOpen(false);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const initDatabases = async () => {
    try {
      await initTables();
      fetchAndUpdateDatabases();
    } catch (error) {
      console.error("Error deleting database:", error);
    }
  };

  return (
    <div>
      <DeleteAllDatabasesModal
        open={deleteAllModalOpen}
        handleClose={() => setDeleteAllModalOpen(false)}
        onDelete={handleDeleteDatabases}
      />
      <DeleteDatabasesModal
        open={deleteModalOpen}
        handleClose={() => setDeleteModalOpen(false)}
        onDelete={handleDeleteDatabase}
        databaseName={databaseName}
      />
      <Header title="Databases" />
      <div className="w-fit mx-auto">
        <Button
          variant="outlined"
          component="label"
          className="flex items-center m-3 justify-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => initDatabases()}
        >
          <BsListColumnsReverse className="mr-2" />
          Initialize Databases
        </Button>
        <Button
          variant="outlined"
          component="label"
          className="flex items-center m-3 justify-center bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setDeleteAllModalOpen(true)}
        >
          <BsTrash className="mr-2" />
          Delete All
        </Button>
      </div>
      <div className="p-2 block max-w-full overflow-x-scroll overflow-y-hidden">
        <div className="h-2" />
        <table className="w-full ">
          <thead>
            {database_table.getHeaderGroups().map((headerGroup) => (
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
            {database_table.getRowModel().rows.map((row) => {
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
      <div className="p-2 block max-w-full overflow-x-scroll overflow-y-hidden">
        <div className="h-2" />
        <table className="w-full ">
          <thead>
            {file_tables.getHeaderGroups().map((headerGroup) => (
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
            {file_tables.getRowModel().rows.map((row) => {
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
  );
}
