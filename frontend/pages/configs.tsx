import React, { useState, useEffect } from "react";
import { getConfigs, updateConfig, getProjects } from "@/pages/api/api";
import Header from "@/components/Header";
import { getCoreRowModel, ColumnDef, flexRender, useReactTable } from "@tanstack/react-table";
import EditModal from "@/components/config/EditConfigModal";
import Edit from "@mui/icons-material/Edit";

type Config = {
  name: string;
  config_id: number;
  project_id: number;
  project_name: string;
  config: {
    name: string;
    embedding_config: {
      args: {
        pretrained_model_name_or_path: string;
      };
      model_name: string;
    };
    reduction_config: {
      args: {
        n_neighbors: number;
        n_components: number;
        metric: string;
        random_state: number;
        n_jobs: number;
      };
      model_name: string;
    };
    cluster_config: {
      args: {
        min_cluster_size: number;
        metric: string;
        cluster_selection_method: string;
      };
      model_name: string;
    };
    model_type: string;
  };
};

/**
 * Menu page used as an overview of existing configs and a possibility to edit them
 */
export default function ConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<any>({});

  const columns: ColumnDef<Config>[] = [
    {
      header: "Config",
      footer: (props) => props.column.id,
      columns: [
        {
          id: "config_name",
          header: () => <span>Config Name</span>,
          cell: (info) => <div className="flex justify-center">{info.row.original.name}</div>,
          footer: (props) => props.column.id,
        },
        {
          id: "config_id",
          header: () => <span>Config ID</span>,
          cell: (info) => <div className="flex justify-center">{info.row.original.config_id}</div>,
          footer: (props) => props.column.id,
        },
        {
          id: "project_id",
          header: () => <span>Project ID</span>,
          cell: (info) => <div className="flex justify-center">{info.row.original.project_id}</div>,
          footer: (props) => props.column.id,
        },
        {
          id: "project_name",
          header: () => <span>Project Name</span>,
          cell: (info) => <div className="flex justify-center">{info.row.original.project_name}</div>,
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
      ],
    },
  ];

  const table = useReactTable({
    columns,
    data: configs,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });
  // Function to fetch and update project data
  const fetchAndUpdateConfigs = async () => {
    try {
      const projectsResponse = await getProjects();
      let projects = projectsResponse.data.data;
      const configResponse = await getConfigs();

      let configData: Config[] = configResponse.data;

      // Merge config data with project data
      for (let i = 0; i < configData.length; i++) {
        for (let j = 0; j < projects.length; j++) {
          if (configData[i].config_id == projects[j].config_id) {
            configData[i].project_name = projects[j].project_name;
            configData[i].project_id = projects[j].project_id;
          }
        }
      }
      // Sort configData by config_id
      configData.sort((a, b) => a.config_id - b.config_id);

      setConfigs(configData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    fetchAndUpdateConfigs();
  }, []);

  const handleEditClick = (config: Config) => {
    setEditData(config);
    setEditModalOpen(true);
  };

  const handleEditConfig = async (config: Config) => {
    try {
      await updateConfig(config.config_id, config);
      fetchAndUpdateConfigs();
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
        onEdit={handleEditConfig}
        config={editData}
        key={editData.config_id}
        setLoading={() => {}}
      />
      <Header title="Configs" />

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
