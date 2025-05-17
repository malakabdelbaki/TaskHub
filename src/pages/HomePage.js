import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import TaskHubLogo from "../icons/TaskHubLogo.svg";
import ProfileIcon from "../icons/ProfileIcon.svg";
import AttachmentIcon from "../icons/AttachmentIcon.svg";
import NoFileIcon from "../icons/NoFileIcon.svg";
import StatusIcon from "../icons/StatusIcon.svg";
import dummyTasks from "./dummyTasks";
import AddIcon from "../icons/AddIcon.svg";
import CancelIcon from "../icons/CancelIcon.svg";


function HomePage({ username }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(dummyTasks);
  const [showModal, setShowModal] = useState(false);


  return (
    <div className="homepage">
      <header className="header">
        <div className="logo-container">
          <img src={TaskHubLogo} alt="TaskHub Logo" className="logo" />
        </div>
        <div className="profile-icon" onClick={() => navigate("/profile")}>
          <img src={ProfileIcon} alt="Profile" className="profile-icon-img" />
        </div>
      </header>

      <div className="welcome-row">
        <h1 className="welcome-text">
          Welcome, <span className="username">{username}</span>
        </h1>
        <button className="new-task-btn" onClick={() => setShowModal(true)}>
          <img src={AddIcon} alt="Add" className="add-icon" />
          New Task
        </button>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Create New Task</h2>
              <img
                src={CancelIcon}
                alt="Close"
                className="close-icon"
                onClick={() => setShowModal(false)}
              />
            </div>

            <div className="modal-body">
              <label className="input-label">Task Title</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g., Submit Assignment"
              />

              <label className="input-label">Attachment <span className="optional">(optional)</span></label>
              <div className="file-upload">
                <input type="file" id="file" className="file-input" />
              </div>
              <p className="file-note">Supported: PDF, DOCX, max 5MB</p>

              <button className="add-task-btn">Add Task</button>
            </div>
          </div>
        </div>
      )}



      <div className="task-table">
        <div className="table-header">
          <span>Task</span>
          <span>
            <img src={AttachmentIcon} className="icon" /> Attachment
          </span>
          <span>
            <img src={StatusIcon} className="icon" /> Status
          </span>
        </div>

        {tasks.map((task, index) => (
          <div className="table-row" key={task.id}>
            <span>{task.title}</span>

            <span className="attachment-cell">
              <img
                src={task.fileType === "no-file" ? NoFileIcon : AttachmentIcon}
                className="icon"
                alt="file"
              />
              {task.file}
            </span>

            <span>
              <select
                value={task.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  const updatedTasks = [...tasks];
                  updatedTasks[index].status = newStatus;
                  setTasks(updatedTasks);
                }}
                className={`status-dropdown ${task.status === "done"
                  ? "status-done"
                  : task.status === "in-progress"
                    ? "status-in-progress"
                    : "status-todo"
                  }`}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
