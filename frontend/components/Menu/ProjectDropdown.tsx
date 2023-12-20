import { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext"; // Replace with the actual path

const ProjectDropdown = () => {
  const { projects, setCurrentProject, currentProject } = useContext(AppContext);
  const [selectedProject, setSelectedProject] = useState(currentProject);

  useEffect(() => {
    setSelectedProject(currentProject);
  }, [currentProject]);

  const handleProjectChange = (event) => {
    const selectedId = parseInt(event.target.value, 10);
    setSelectedProject(selectedId);
    setCurrentProject(selectedId);
  };

  return (
    <select value={selectedProject} onChange={handleProjectChange}>
      {projects.map((project) => (
        <option key={project.project_id} value={project.project_id}>
          {project.project_name}
        </option>
      ))}
    </select>
  );
};

export default ProjectDropdown;
