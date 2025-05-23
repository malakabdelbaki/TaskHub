import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import "./HomePage.css";
import TaskHubLogo from "../icons/TaskHubLogo.svg";
import ProfileIcon from "../icons/ProfileIcon.svg";
import AttachmentIcon from "../icons/AttachmentIcon.svg";
import NoFileIcon from "../icons/NoFileIcon.svg";
import StatusIcon from "../icons/StatusIcon.svg";
import dummyTasks from "./dummyTasks";
import AddIcon from "../icons/AddIcon.svg";
import CancelIcon from "../icons/CancelIcon.svg";
import DeleteIcon from "../icons/DeleteIcon.svg";
import EditIcon from "../icons/editIcon.png";

function HomePage({ username }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [newAttachment, setNewAttachment] = useState(null);
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskGroupId, setTaskGroupId] = useState("");
  const [userGroupId, setUserGroupId] = useState("");

  const fetchTasks = async () => {
    try {
      console.log("Starting fetchTasks...");
      setIsLoading(true);
      setError(null);

      const token = auth.user?.id_token;
      if (!token) throw new Error('No ID token available');
      
      const userId = auth.user.profile?.sub ?? auth.user.sub;
      if (!userId) throw new Error('No user ID available');

      console.log("Fetching tasks for user:", userId);

      const response = await fetch(
        `https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/listTasksFn?user_id=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch tasks');
      }

      const { tasks } = await response.json();
      console.log("Raw tasks data from backend:", tasks);
      setTasks(tasks || []);
      
      if (tasks && tasks.length > 0) {
        console.log("First task sample:", {
          id: tasks[0].task_id,
          title: tasks[0].title,
          priority: tasks[0].priority,
          deadline: tasks[0].deadline,
          status: tasks[0].status
        });
      }

    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id_token) {
      console.log("Fetching tasks on component mount...");
      fetchTasks();
    } else {
      console.log('Not authenticated or no token available');
    }
  }, [auth.isAuthenticated, auth.user?.id_token]);

  const handleSubmit = async () => {
    try {
      console.log("Starting task creation...");
      const token = auth.user?.id_token;
      if (!token) throw new Error('Not logged in');
      const uid = auth.user.profile?.sub ?? auth.user.sub;
      if (!uid) throw new Error('User ID missing');
      if (!taskTitle.trim()) throw new Error('Title required');

      console.log("Creating task with data:", {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        deadline: taskDeadline,
        status: 'ToDo'
      });

      // Create the task with all required attributes
      const taskRes = await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/createTaskFn', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: uid,
          title: taskTitle,
          status: 'ToDo',
          description: taskDescription || '',
          priority: taskPriority,
          deadline: taskDeadline || null,
          task_group_id: taskGroupId || null,
          user_group_id: userGroupId || null,
          attachment_keys: []
        })
      });

      if (!taskRes.ok) {
        const text = await taskRes.text();
        throw new Error(`Create task failed: ${taskRes.status} ${text}`);
      }

      const { task_id } = await taskRes.json();

      // Handle file upload if any
      if (selectedFile) {
        const fileContent = await selectedFile.arrayBuffer();
        const base64Data = btoa(
          new Uint8Array(fileContent)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const uploadRes = await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/uploadFileFn', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            task_id: task_id,
            filename: selectedFile.name,
            content_type: selectedFile.type,
            file_data: base64Data
          })
        });

        if (!uploadRes.ok) {
          const text = await uploadRes.text();
          throw new Error(`Upload failed: ${text}`);
        }

        const uploadData = await uploadRes.json();
        if (uploadData.attachment_key) {
          // Update task with attachment key
          await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/updateTask', {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: uid,
              task_id: task_id,
              title: taskTitle,
              status: 'ToDo',
              attachment_s3_keys: [uploadData.attachment_key]
            })
          });
        }
      }

      await fetchTasks();
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('medium');
      setTaskDeadline('');
      setTaskGroupId('');
      setUserGroupId('');
      setSelectedFile(null);
      setShowModal(false);

    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  async function uploadAndUpdateTask({ token, userId, taskId, title, status, description, priority, deadline, file }) {
    if (!taskId || !userId) {
      throw new Error('Missing task_id or user_id');
    }

    const attachment_s3_keys = [];

    // Step 1: Upload new file (if any)
    if (file) {
      const fileContent = await file.arrayBuffer();
      const base64Data = btoa(
        new Uint8Array(fileContent).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const uploadRes = await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/uploadFileFn', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_id: taskId,
          filename: file.name,
          content_type: file.type,
          file_data: base64Data
        })
      });

      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(`Upload failed: ${text}`);
      }

      const { attachment_key } = await uploadRes.json();
      if (attachment_key) {
        attachment_s3_keys.push(attachment_key);
      }
    }

    // Step 2: Send update to Lambda with all required fields
    const updateRes = await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/updateTask', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task_id: taskId,
        user_id: userId,
        title: title,
        status: status,
        description: description || '',
        priority: priority || 'medium',
        deadline: deadline || null,
        attachment_s3_keys
      })
    });

    if (!updateRes.ok) {
      const text = await updateRes.text();
      throw new Error(`Update failed: ${text}`);
    }
    await fetchTasks();
    return await updateRes.json();
  }

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
              <div className="form-group">
                <label className="input-label">Task Title</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g., Submit Assignment"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="input-label">Description</label>
                <textarea
                  className="text-input description-input"
                  placeholder="Add task description..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="input-label">Priority</label>
                <select
                  className="text-input priority-select"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="input-label">Deadline</label>
                <input
                  type="datetime-local"
                  className="text-input deadline-input"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="input-label">Status</label>
                <select
                  className="text-input status-select"
                  value="ToDo"
                  disabled
                >
                  <option value="ToDo">To Do</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                <p className="form-note">New tasks are always set to 'To Do' initially</p>
              </div>

              <div className="form-group">
                <label className="input-label">Attachment <span className="optional">(optional)</span></label>
                <div className="file-upload">
                  <input 
                    type="file" 
                    id="file" 
                    className="file-input"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                  <label htmlFor="file" className="file-upload-label">
                    {selectedFile ? selectedFile.name : 'Choose File'}
                  </label>
                </div>
                <p className="file-note">Supported: PDF, DOCX, max 5MB</p>
              </div>

              <button 
                className="add-task-btn"
                onClick={handleSubmit}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="task-table">
        <div className="table-header">
          <span>Task</span>
          <span>Description</span>
          <span>Priority</span>
          <span>Deadline</span>
          <span><img src={AttachmentIcon} className="icon" /> Attachment</span>
          <span><img src={StatusIcon} className="icon" /> Status</span>
        </div>

        {isLoading ? (
          <div className="loading-message">Loading tasks...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="no-tasks-message">No tasks found. Create your first task!</div>
        ) : (
          tasks.map((task, index) => (
            <div className="table-row" key={task.task_id}>
              <span className="task-title">{task.title}</span>
              <span className="description-cell">{task.description || 'No description'}</span>
            
              <span className={`priority-cell priority-${task.priority?.toLowerCase() || 'medium'}`}>
                {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
              </span>
              <span className="deadline-cell">
                {task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline'}
              </span>
              <span className="attachment-cell">
                {Array.isArray(task.attachment_s3_keys) && task.attachment_s3_keys.length > 0 ? (
                  <a
                    href={task.attachment_s3_keys[0]}
                    target="_blank"
                    rel="noopener noreferrer"  
                  >
                    <img src={AttachmentIcon} className="icon" alt="file" />
                    View Attachment
                  </a>
                ) : (
                  <>
                    <img src={NoFileIcon} className="icon" alt="no file" />
                    No file attached
                  </>
                )}
              </span>

              <span className="status-actions">
                <select
                  value={task.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    const updatedTasks = [...tasks];
                    updatedTasks[index].status = newStatus;
                    setTasks(updatedTasks);

                    try {
                      const token = auth.user?.id_token;
                      const userId = auth.user?.profile?.sub ?? auth.user.sub;
                      await uploadAndUpdateTask({
                        token,
                        userId,
                        taskId: task.task_id,
                        title: task.title,
                        status: newStatus,
                        description: task.description,
                        priority: task.priority,
                        deadline: task.deadline
                      });
                    } catch (err) {
                      console.error("Failed to update task:", err);
                      setError(err.message);
                    }
                  }}
                  className={`status-dropdown ${
                    task.status === "Done"
                      ? "status-done"
                      : task.status === "InProgress"
                        ? "status-in-progress"
                        : "status-todo"
                  }`}
                >
                  <option value="ToDo">To Do</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                <button 
                  className="details-btn" 
                  onClick={() => {
                    setSelectedTask(task);
                    setEditedTitle(task.title);
                    setEditedDescription(task.description || "");
                    setShowDetailsModal(true);
                  }}
                >
                  <img src={EditIcon} alt="Details" />
                </button>
                <button className="delete-btn" onClick={() => { /* placeholder */ }}>
                  <img src={DeleteIcon} alt="Delete" />
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      {showDetailsModal && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-box details-modal">
            <div className="modal-header">
              <h2>Task Details</h2>
              <img
                src={CancelIcon}
                alt="Close"
                className="close-icon"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTask(null);
                  setNewAttachment(null);
                }}
              />
            </div>

            <div className="modal-body">
              <label className="input-label">Title</label>
              <input
                type="text"
                className="text-input"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />

              <label className="input-label">Description</label>
              <textarea
                className="text-input description-input"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Add a description..."
              />

              <label className="input-label">Current Attachment</label>
              {selectedTask.attachments && selectedTask.attachments[0]?.url ? (
                <div className="attachment-preview">
                  <a
                    href={selectedTask.attachments[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={AttachmentIcon} className="icon" alt="file" />
                    {selectedTask.attachments[0].filename || "View Attachment"}
                  </a>
                </div>
              ) : (
                <div className="no-attachment">
                  <img src={NoFileIcon} className="icon" alt="no file" />
                  No file attached
                </div>
              )}

              <label className="input-label">Upload New Attachment <span className="optional">(optional)</span></label>
              <div className="file-upload">
                <input 
                  type="file" 
                  id="newFile" 
                  className="file-input"
                  onChange={(e) => setNewAttachment(e.target.files[0])}
                />
              </div>
              <p className="file-note">Supported: PDF, DOCX, max 5MB</p>

              <button 
                className="save-btn"
                onClick={async () => {
                  try {
                    const token = auth.user?.id_token;
                    const userId = auth.user?.profile?.sub ?? auth.user.sub;

                    await uploadAndUpdateTask({
                      token,
                      userId,
                      taskId: selectedTask.task_id,
                      title: editedTitle,
                      status: selectedTask.status,
                      description: editedDescription,
                      priority: selectedTask.priority,
                      deadline: selectedTask.deadline,
                      file: newAttachment
                    });

                    setShowDetailsModal(false);
                    setSelectedTask(null);
                    setNewAttachment(null);
                  } catch (err) {
                    console.error("Failed to update task:", err);
                    setError(err.message);
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
