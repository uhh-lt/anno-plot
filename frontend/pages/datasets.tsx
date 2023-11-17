import React, { useState, useEffect } from "react";
import { getDatasets, updateDataset, deleteDataset } from "@/pages/api/api";
import Header from "@/components/Header";
import { getCoreRowModel, ColumnDef, flexRender, useReactTable } from "@tanstack/react-table";
import EditModal from "@/components/dataset/EditDatasetModal";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import DeleteDatasetModal from "@/components/dataset/DeleteDatasetModal";
import UploadModal from "@/components/dataset/UploadDatasetModal";
import { Button, CircularProgress } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { BsListColumnsReverse } from "react-icons/bs";

type Dataset = {
  project_id: number;
  dataset_name: string;
  dataset_id: number;
};

/**
 * Data page used to display all existing datasets with the possibility to edit, delete or create new ones
 */
export default function DatasetPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [projectId, setProjectId] = useState(
    typeof window !== "undefined" ? parseInt(localStorage.getItem("projectId") ?? "1") : 1,
  );
  const [datasetId, setDatasetId] = useState(0);
  const [editData, setEditData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [exportSuccess, setSuccess] = useState(false);

  const columns: ColumnDef<Dataset>[] = [
    {
      header: "Dataset",
      footer: (props) => props.column.id,
      columns: [
        {
          accessorFn: (row) => row.dataset_id,
          id: "dataset_id",
          cell: (info) => info.getValue(),
          header: () => <span>Dataset ID</span>,
          footer: (props) => props.column.id,
        },
        {
          accessorFn: (row) => row.project_id,
          id: "project_id",
          cell: (info) => info.getValue(),
          header: () => <span>Project ID</span>,
          footer: (props) => props.column.id,
        },
        {
          accessorFn: (row) => row.dataset_name,
          id: "dataset_name",
          cell: (info) => info.getValue(),
          header: () => <span>Dataset name</span>,
          footer: (props) => props.column.id,
        },
      ],
    },
    {
      header: "Actions",
      footer: (props) => props.column.id,
      columns: [
        {
          id: "edit",
          maxSize: 5,
          header: () => <span>Edit</span>,
          cell: (info) => (
            <div className="flex justify-center">
              <Edit
                className="cursor-pointer"
                onClick={() => {
                  handleEditClick(info.row.original);
                }}
              />
            </div>
          ),
          footer: (props) => props.column.id,
        },
        {
          id: "delete",
          maxSize: 5,
          header: () => <span>Delete</span>,
          cell: (info) => (
            <div className="flex justify-center">
              <Delete
                className="cursor-pointer"
                onClick={() => {
                  setDatasetId(info.row.original.dataset_id);
                  setProjectId(info.row.original.project_id);
                  setConfirmModalOpen(true);
                }}
              />
            </div>
          ),
          footer: (props) => props.column.id,
        },
      ],
    },
  ];

  const table = useReactTable({
    columns,
    data: datasets,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });
  // Function to fetch and update project data
  const fetchAndUpdateDatasets = async () => {
    try {
      const result = await getDatasets(projectId);
      let datasetData: Dataset[] = result.data;
      setDatasets(datasetData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    fetchAndUpdateDatasets();
  }, []);

  const handleDeleteDataset = async () => {
    try {
      await deleteDataset(projectId, datasetId);
      fetchAndUpdateDatasets();
      setConfirmModalOpen(false);
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleEditClick = (dataset: Dataset) => {
    setEditData({ dataset_id: dataset.dataset_id, project_id: dataset.project_id, dataset_name: dataset.dataset_name });
    setEditModalOpen(true);
  };

  const handleEditDataset = async (dataset: Dataset) => {
    try {
      await updateDataset(dataset.project_id, dataset.dataset_id, dataset.dataset_name);
      fetchAndUpdateDatasets();
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error editing project:", error);
    }
  };

  return (
    <header>
      <EditModal
        open={editModalOpen}
        handleClose={() => setEditModalOpen(false)}
        onEdit={handleEditDataset}
        dataset={editData}
      />
      <DeleteDatasetModal
        open={confirmModalOpen}
        handleClose={() => setConfirmModalOpen(false)}
        onDelete={handleDeleteDataset}
        projectId={projectId}
        datasetId={datasetId}
      />

      <Header title="Datasets Data" />
      <div className="flex justify-center">
        <div className="content-center">
          <UploadModal
            open={open}
            handleClose={() => setOpen(false)}
            projectId={projectId}
            updateDatasets={fetchAndUpdateDatasets}
            setLoading={setLoading}
            setSuccess={setSuccess}
          />

          <Button
            variant="outlined"
            component="label"
            className="flex items-center justify-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
            onClick={() => setOpen(true)}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : exportSuccess ? (
              <CheckIcon style={{ color: "green", marginRight: "8px" }} />
            ) : (
              <BsListColumnsReverse className="mr-2" />
            )}
            Upload
          </Button>
        </div>
      </div>
      <div className="p-2 block max-w-full overflow-x-scroll overflow-y-hidden">
        <div className="h-2" />
        <table className="w-full ">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
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
            {table.getRowModel().rows.map((row) => {
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
