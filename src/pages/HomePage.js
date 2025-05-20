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



function HomePage({ username }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = auth.user?.id_token;
      if (!token) {
        throw new Error('No ID token available');
      }

      // Parse and validate token
      const response = await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/listTasksFn', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        console.log("response "+response);
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Ensure data is an array
      if (!data || !data.tasks) {
        console.log("empty : "+data)
        setTasks([]);
        return;
      }

      setTasks(data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.message);
      setTasks([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id_token) {
      console.log('Auth User Details:', {
        ...auth.user,
        id_token: 'REDACTED' // Not logging the actual token for security
      });
      fetchTasks();
    } else {
      console.log('Not authenticated or no token available');
    }
  }, [auth.isAuthenticated, auth.user?.id_token]);

  // const handleSubmit = async () => {
  //   try {
  //     if (!auth.user?.id_token) {
  //       throw new Error('No ID token available');
  //     }

  //     // Debug logging
  //     console.log('Auth object:', auth);
  //     console.log('Auth user:', auth.user);
  //     console.log('Auth user sub:', auth.user?.sub);
  //     console.log('Auth user claims:', auth.user?.profile);

  //     const taskData = {
  //       user_id: auth.user?.profile?.sub || auth.user?.sub,
  //       title: taskTitle,
  //       status: 'ToDo',
  //       attachment_s3_keys: selectedFile ? [selectedFile.name] : []
  //     };

  //     console.log('Task data being sent:', taskData);

  //     const response = await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/createTaskFn', {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${auth.user.id_token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify(taskData)
  //     });
  //     console.log(response)
  //     // Debug response
  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       console.error('Error response:', errorText);
  //       console.log("response "+response);
  //       throw new Error(`Failed to create task: ${response.status} ${response.statusText}`);
  //     }

  //     const newTask = await response.json();
  //     setTasks([...tasks, newTask]);
  //     setTaskTitle("");
  //     setSelectedFile(null);
  //     setShowModal(false);
  //   } catch (error) {
  //     console.error('Error creating task:', error);
  //     setError(error.message);
  //   }
  // };
  // HomePage.js (or wherever your form lives)
  // const handleSubmit = async () => {
  //   try {
  //     const token = auth.user?.id_token;
  //     if (!token) throw new Error('Not logged in');
  //     const uid = auth.user.profile?.sub ?? auth.user.sub;
  //     if (!uid) throw new Error('User ID missing');
  //     if (!taskTitle.trim()) throw new Error('Title required');
  
  //     // 1️⃣ Upload file to uploadFileFn (if any)
  //     let attachment_key = null;
  //     if (selectedFile) {
  //       const form = new FormData();
  //       form.append('file', selectedFile);
  //       const up = await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/uploadFileFn', {
  //         method: 'POST',
  //         headers: { Authorization: `Bearer ${token}` },
  //         body: form
  //       });
  //       if (!up.ok) throw new Error('Upload failed');
  //       ({ attachment_key } = await up.json());
  //     }
  
  //     // 2️⃣ Create the task with only JSON
  //     const taskRes = await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/createTaskFn', {
  //       method: 'POST',
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({
  //         user_id: uid,
  //         title: taskTitle,
  //         status: 'ToDo',
  //         attachment_key
  //       })
  //     });
  //     console.log("task resp "+ taskRes.headers);
  //     if (!taskRes.ok) {
  //       const text = await taskRes.text();
  //       throw new Error(`Create failed: ${taskRes.status} ${text}`);
  //     }
  //     const { task_id } = await taskRes.json();
  
  //     setTasks(prev => [
  //       ...prev,
  //       { task_id, user_id: uid, title: taskTitle, status: 'ToDo', attachment_key }
  //     ]);
  //     setTaskTitle('');
  //     setSelectedFile(null);
  //     setShowModal(false);
  
  //   } catch (e) {
  //     console.error(e);
  //     setError(e.message);
  //   }
  // };
  const handleSubmit = async () => {
    try {
      const token = auth.user?.id_token;
      if (!token) throw new Error('Not logged in');
      const uid = auth.user.profile?.sub ?? auth.user.sub;
      if (!uid) throw new Error('User ID missing');
      if (!taskTitle.trim()) throw new Error('Title required');
  
      // 🔄 Unified multipart/form-data request
      const form = new FormData();
      form.append('user_id', uid);
      form.append('title', taskTitle);
      form.append('status', 'ToDo');
  
      if (selectedFile) {
        form.append('file', selectedFile);
      }
  
      const res = await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/createTaskFn', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: form
      });
  console.log("res "+res.headers+ " "+res.status+ " "+res.body)
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Create failed: ${res.status} ${text}`);
      }
  
      const { task_id } = await res.json();
  
      setTasks(prev => [
        ...prev,
        { task_id, user_id: uid, title: taskTitle, status: 'ToDo', attachment_key: selectedFile ? 'uploaded' : null }
      ]);
  
      setTaskTitle('');
      setSelectedFile(null);
      setShowModal(false);
  
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };
  

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
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />

              <label className="input-label">Attachment <span className="optional">(optional)</span></label>
              <div className="file-upload">
                <input 
                  type="file" 
                  id="file" 
                  className="file-input"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
              </div>
              <p className="file-note">Supported: PDF, DOCX, max 5MB</p>

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
          <span>
            <img src={AttachmentIcon} className="icon" /> Attachment
          </span>
          <span>
            <img src={StatusIcon} className="icon" /> Status
          </span>
        </div>

        {isLoading ? (
          <div className="loading-message">Loading tasks...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="no-tasks-message">No tasks found. Create your first task!</div>
        ) : (
          tasks.map((task, index) => (
            <div className="table-row" key={task.id}>
              <span>{task.title}</span>

              <span className="attachment-cell">
                <img
                  src={task.fileType === "no-file" ? NoFileIcon : AttachmentIcon}
                  className="icon"
                  alt="file"
                />
                {task.file || "No file attached"}
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
                <button className="delete-btn" onClick={() => { /* placeholder */ }}>
                  <img src={DeleteIcon} alt="Delete" />
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HomePage;
