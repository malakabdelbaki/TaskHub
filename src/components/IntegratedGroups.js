import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import './UserGroups.css';
import '../pages/HomePage.css';
import TaskHubLogo from "../icons/TaskHubLogo.svg";
import ProfileIcon from "../icons/ProfileIcon.svg";
import AttachmentIcon from "../icons/AttachmentIcon.svg";
import NoFileIcon from "../icons/NoFileIcon.svg";
import StatusIcon from "../icons/StatusIcon.svg";
import AddIcon from "../icons/AddIcon.svg";
import CancelIcon from "../icons/CancelIcon.svg";
import DeleteIcon from "../icons/DeleteIcon.svg";
import EditIcon from "../icons/editIcon.png";
import GroupInvitations from "./GroupInvitations";

const IntegratedGroups = ({ username }) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const userId = auth.user?.profile?.sub ?? auth.user.sub;

  // Group and Task Group States
  const [groups, setGroups] = useState([]);
  const [taskGroups, setTaskGroups] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupTasks, setGroupTasks] = useState({});

  // Task Management States
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [newAttachment, setNewAttachment] = useState(null);

  // Group Creation States
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateTaskGroupModal, setShowCreateTaskGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newTaskGroupName, setNewTaskGroupName] = useState('');
  const [selectedGroupForTaskGroup, setSelectedGroupForTaskGroup] = useState(null);
  const [selectedTaskGroupForTask, setSelectedTaskGroupForTask] = useState(null);

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserGroups = async () => {
    try {
      const response = await fetch(
        `https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/UserGroupManagement/get-user-groups?user_id=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user groups');
      }

      const data = await response.json();
      setGroups(data.groups);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch user groups');
      setLoading(false);
    }
  };

  const fetchTaskGroups = async (userGroupId) => {
    try {
      const response = await fetch(
        `https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/TaskGroupManager/get-task-groups?user_group_id=${userGroupId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch task groups');
      }

      const data = await response.json();
      const groups = data.task_groups;

      setTaskGroups(prev => ({
        ...prev,
        [userGroupId]: groups
      }));

      // Fetch tasks for each task group
      const tasksByGroup = {};
      for (const taskGroup of groups) {
        const tasks = await fetchTasksForTaskGroup(taskGroup.group_id);
        tasksByGroup[taskGroup.group_id] = tasks;
      }

      setGroupTasks(prev => ({
        ...prev,
        [userGroupId]: tasksByGroup
      }));

    } catch (err) {
      console.error('Error fetching task groups:', err);
    }
  };

  const fetchTasksForTaskGroup = async (taskGroupId) => {
    try {
      const response = await fetch(
        `https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/listTasksFn?task_group_id=${taskGroupId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      return data.tasks || [];
    } catch (err) {
      console.error(`Error fetching tasks for task group ${taskGroupId}:`, err);
      return [];
    }
  };

  const handleCreateTask = async () => {
    try {
      if (!selectedTaskGroupForTask) {
        throw new Error('No task group selected');
      }

      const token = auth.user?.id_token;
      if (!token) throw new Error('Not logged in');

      // Create the task
      const taskRes = await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/createTaskFn', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          title: newTaskTitle,
          status: 'ToDo',
          task_group_id: selectedTaskGroupForTask.group_id,
          user_group_id: selectedGroup.group_id,
          priority: 'Low',
          deadline: null,
          attachment_keys: [],  // no attachments yet
        })
      });

      if (!taskRes.ok) {
        throw new Error('Failed to create task');
      }

      const { task_id } = await taskRes.json();

      // Handle file upload if present
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
          throw new Error('Failed to upload file');
        }

        const { attachment_key } = await uploadRes.json();

        // Update task with attachment
        await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/updateTask', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            task_id: task_id,
            attachment_s3_keys: [attachment_key]
          })
        });
      }

      await fetchTaskGroups(selectedGroup.group_id);
      setShowCreateTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setSelectedFile(null);
      setSelectedTaskGroupForTask(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const token = auth.user?.id_token;
      if (!token) throw new Error('Not logged in');

      const attachment_s3_keys = [];

      if (updates.file) {
        const fileContent = await updates.file.arrayBuffer();
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
            task_id: taskId,
            filename: updates.file.name,
            content_type: updates.file.type,
            file_data: base64Data
          })
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload file');
        }

        const { attachment_key } = await uploadRes.json();
        attachment_s3_keys.push(attachment_key);
      }

      const updateRes = await fetch('https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/updateTask', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          task_id: taskId,
          ...(updates.title && { title: updates.title }),
          ...(updates.status && { status: updates.status }),
          ...(updates.description && { description: updates.description }),
          attachment_s3_keys
        })
      });

      if (!updateRes.ok) {
        throw new Error('Failed to update task');
      }

      await fetchTaskGroups(selectedGroup.group_id);
      setShowDetailsModal(false);
      setSelectedTask(null);
      setNewAttachment(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId, userGroupId) => {
    try {
      const token = auth.user?.id_token;
      if (!token) throw new Error('Not logged in');

      const response = await fetch(
        `https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/deleteTaskFn`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ task_id: taskId, user_id: userId }), // Assuming delete needs task_id and user_id
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Refresh tasks for the current user group
      await fetchTaskGroups(userGroupId);

    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  const handleCreateGroup = async () => {
    try {
      const response = await fetch(
        'https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/UserGroupManagement/create-group',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newGroupName,
            created_by: userId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      await fetchUserGroups();
      setShowCreateGroupModal(false);
      setNewGroupName('');
    } catch (err) {
      setError('Failed to create group');
    }
  };

  const handleCreateTaskGroup = async () => {
    try {
      if (!selectedGroupForTaskGroup) {
        throw new Error('No group selected for task group');
      }

      const response = await fetch(
        'https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/TaskGroupManager/create-task-group',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            name: newTaskGroupName,
            user_group_id: selectedGroupForTaskGroup.group_id,
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create task group');
      }

      await fetchTaskGroups(selectedGroupForTaskGroup.group_id);
      setShowCreateTaskGroupModal(false);
      setNewTaskGroupName('');
    } catch (err) {
      setError('Failed to create task group');
    }
  };

  useEffect(() => {
    fetchUserGroups();
  }, [userId]);

  useEffect(() => {
    if (selectedGroup) {
      fetchTaskGroups(selectedGroup.group_id);
    }
  }, [selectedGroup]);

  // if (loading) return <div className="loading">Loading groups...</div>;
  if (error) return <div className="error">{error}</div>;

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
      </div>

      <div className="main-content">
        <GroupInvitations userId={userId} groups={groups} fetchUserGroups={fetchUserGroups} />

        <div className="user-groups">
          <div className="groups-header">
            <h2>Your Groups</h2>
            <button className="create-group-btn" onClick={() => setShowCreateGroupModal(true)}>
              <img src={AddIcon} alt="Add" className="add-icon" />
              Create Group
            </button>
          </div>

          <div className="groups-container">
            <div className="group-section">
              <h3>Group Workspaces</h3>
              {groups.map((group) => (
                <div key={group.group_id} className="group-container">
                  <div
                    className={`group-card ${selectedGroup?.group_id === group.group_id ? 'selected' : ''}`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="group-card-header">
                      <h3>{group.group_name}</h3>
                      <button 
                        className="create-task-group-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroupForTaskGroup(group);
                          setShowCreateTaskGroupModal(true);
                        }}
                      >
                        <img src={AddIcon} alt="Add Task Group" className="add-icon" />
                        New Task Group
                      </button>
                    </div>
                    <p className="group-role">{group.role}</p>
                  </div>

                  {selectedGroup?.group_id === group.group_id && taskGroups[group.group_id] && (
                    <div className="task-groups-section">
                      {taskGroups[group.group_id].map((taskGroup) => (
                        <div key={taskGroup.group_id} className="task-group-container">
                          <div className="task-group-header">
                            <h4>{taskGroup.name}</h4>
                            <button 
                              className="create-task-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTaskGroupForTask(taskGroup);
                                setSelectedGroupForTaskGroup(group);
                                setShowCreateTaskModal(true);
                              }}
                            >
                              <img src={AddIcon} alt="Add Task" className="add-icon" />
                              New Task
                            </button>
                          </div>
                          <div className="tasks-list">
                            {groupTasks[group.group_id]?.[taskGroup.group_id]?.map((task) => (
                              <div key={task.task_id} className="task-item">
                                <div className="task-title">{task.title}</div>
                                <div className="task-actions">
                                  <select
                                    value={task.status}
                                    onChange={(e) => handleUpdateTask(task.task_id, { status: e.target.value })}
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
                                  <button className="delete-btn" onClick={() => handleDeleteTask(task.task_id, group.group_id)}>
                                    <img src={DeleteIcon} alt="Delete" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {(!groupTasks[group.group_id]?.[taskGroup.group_id] || 
                              groupTasks[group.group_id][taskGroup.group_id].length === 0) && (
                              <div className="no-tasks">No tasks in this group</div>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!taskGroups[group.group_id] || taskGroups[group.group_id].length === 0) && (
                        <div className="no-task-groups">No task groups created yet</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Create New Group</h2>
              <img
                src={CancelIcon}
                alt="Close"
                className="close-icon"
                onClick={() => setShowCreateGroupModal(false)}
              />
            </div>
            <div className="modal-body">
              <label className="input-label">Group Name</label>
              <input
                type="text"
                className="text-input"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
              />
              <button className="create-btn" onClick={handleCreateGroup}>
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Group Modal */}
      {showCreateTaskGroupModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Create New Task Group</h2>
              <img
                src={CancelIcon}
                alt="Close"
                className="close-icon"
                onClick={() => {
                  setShowCreateTaskGroupModal(false);
                  setSelectedGroupForTaskGroup(null);
                }}
              />
            </div>
            <div className="modal-body">
              <label className="input-label">Task Group Name</label>
              <input
                type="text"
                className="text-input"
                value={newTaskGroupName}
                onChange={(e) => setNewTaskGroupName(e.target.value)}
                placeholder="Enter task group name"
              />
              <button className="create-btn" onClick={handleCreateTaskGroup}>
                Create Task Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Create New Task</h2>
              <img
                src={CancelIcon}
                alt="Close"
                className="close-icon"
                onClick={() => {
                  setShowCreateTaskModal(false);
                  setSelectedTaskGroupForTask(null);
                  setSelectedFile(null);
                }}
              />
            </div>
            <div className="modal-body">
              <label className="input-label">Task Title</label>
              <input
                type="text"
                className="text-input"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title"
              />

              <label className="input-label">Description</label>
              <textarea
                className="text-input description-input"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Add a description..."
              />

              <label className="input-label">Attachment <span className="optional">(optional)</span></label>
              <div className="file-upload">
                <input 
                  type="file" 
                  id="createTaskFile" 
                  className="file-input"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <label htmlFor="createTaskFile">Choose File</label>
                {selectedFile && (
                  <div className="selected-file">
                    <img src={AttachmentIcon} className="icon" alt="file" />
                    {selectedFile.name}
                  </div>
                )}
              </div>
              <p className="file-note">Supported: PDF, DOCX, max 5MB</p>

              <button 
                className="create-btn" 
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
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
                  id="updateTaskFile" 
                  className="file-input"
                  onChange={(e) => setNewAttachment(e.target.files[0])}
                />
                <label htmlFor="updateTaskFile">Choose File</label>
                {newAttachment && (
                  <div className="selected-file">
                    <img src={AttachmentIcon} className="icon" alt="file" />
                    {newAttachment.name}
                  </div>
                )}
              </div>
              <p className="file-note">Supported: PDF, DOCX, max 5MB</p>

              <button 
                className="save-btn"
                onClick={() => handleUpdateTask(selectedTask.task_id, {
                  title: editedTitle,
                  description: editedDescription,
                  file: newAttachment
                })}
                disabled={!editedTitle.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegratedGroups; 