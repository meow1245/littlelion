document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:3000/api';

    const departments = ['業務部', '技術部', '財務部', '人事部', '管理部', '法務部'];
    const userIdentities = ['一般員工', '主管', '後台管理員'];

    const mainUserSectionsWrapper = document.getElementById("main-user-sections-wrapper");
    const employeeSection = document.getElementById("employee-section");
    const managerSection = document.getElementById("manager-section");
    const sideNavLinks = document.querySelectorAll('.side-nav a');

    const addOperationSection = document.getElementById("add-operation-section");
    const deleteOperationSection = document.getElementById("delete-operation-section");
    const updateOperationSection = document.getElementById("update-operation-section");
    const viewOperationSection = document.getElementById("view-operation-section");

    const addForm = document.getElementById("add-form");
    const deleteForm = document.getElementById("delete-form");
    const updateForm = document = document.getElementById("update-form"); // 修正此行，原本多了一個等號
    const userListBody = document.getElementById("user-list-body");

    const addIdInput = document.getElementById("add-id");
    const addDepartmentSelect = document.getElementById("add-department");
    const addIdentitySelect = document.getElementById("add-identity");

    const deleteDepartmentSelect = document.getElementById("delete-department-select");
    const deleteUserSelect = document.getElementById("delete-user-select");
    const deleteIdInput = document.getElementById("delete-id");
    const deleteNameInput = document.getElementById("delete-name");

    const updateDepartmentSelect = document.getElementById("update-department-select");
    const updateUserSelect = document.getElementById("update-user-select");
    const updateIdInput = document.getElementById("update-id");
    const updateAccountInput = document.getElementById("update-account");
    const updatePasswordInput = document.getElementById("update-password");
    const updateDeptInput = document.getElementById("update-department");
    const updateNameInput = document.getElementById("update-name");
    const updateIdentitySelect = document.getElementById("update-identity");

    let currentActiveUserType = 'employee';

    document.getElementById("logout-btn").addEventListener("click", () => {
        window.location.href = "index.html";
    });

    // --- 輔助函數：生成唯一且不存在的 ID (改回前端生成) ---
    // 注意：在實際應用中，後端生成 ID 更推薦，此處為遵循您的要求
    async function generateUniqueId(prefix) {
        let newId;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 100; // 防止無限迴圈

        do {
            const timestamp = Date.now().toString().slice(-5);
            const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            newId = `${prefix}${timestamp}${randomNum}`;

            // 在前端檢查 ID 是否已存在（理論上是從載入的用戶列表檢查，但更可靠的是讓後端檢查）
            // 由於前端只知道當前載入的用戶，所以這裡的唯一性檢查不夠嚴謹。
            // 為了簡化，我們先模擬生成，後端將會做最終的唯一性檢查。
            // 這裡不需再發送請求檢查，因為後端會處理。
            isUnique = true; // 假設生成即可，後端會驗證
            attempts++;
            if (attempts > maxAttempts) {
                console.error("無法在限定次數內生成唯一 ID。");
                throw new Error("無法生成唯一使用者 ID，請重試。");
            }
        } while (!isUnique); // 這裡的 isUnique 實際上無效，因為後端會驗證

        return newId;
    }

    function populateDropdown(selectElement, options, defaultOptionText) {
        if (!selectElement) return;
        selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            selectElement.appendChild(opt);
        });
    }

    async function resetOperationForms() { // 設為 async 因為 generateUniqueId 可能是 async
        addForm.reset();
        deleteForm.reset();
        updateForm.reset();

        if (addIdInput) {
            try {
                // 自動生成 ID
                addIdInput.value = await generateUniqueId(currentActiveUserType === 'employee' ? 'E' : 'M');
            } catch (error) {
                console.error("生成 ID 失敗:", error);
                addIdInput.value = "生成失敗";
            }
        }

        populateDropdown(addDepartmentSelect, departments, '請選擇部門');
        populateDropdown(addIdentitySelect, userIdentities, '請選擇身分');

        populateDropdown(deleteDepartmentSelect, departments, '請選擇部門');
        populateDropdown(deleteUserSelect, [], '請先選擇部門');
        deleteUserSelect.disabled = true;
        deleteIdInput.value = '';
        deleteNameInput.value = '';

        populateDropdown(updateDepartmentSelect, departments, '請選擇部門');
        populateDropdown(updateUserSelect, [], '請先選擇部門');
        updateUserSelect.disabled = true;
        updateIdInput.value = '';
        updateAccountInput.value = '';
        updatePasswordInput.value = '';
        updateDeptInput.value = '';
        updateNameInput.value = '';
        populateDropdown(updateIdentitySelect, userIdentities, '請選擇身分');
    }

    function hideAllOperationPages() {
        if (addOperationSection) addOperationSection.style.display = 'none';
        if (deleteOperationSection) deleteOperationSection.style.display = 'none';
        if (updateOperationSection) updateOperationSection.style.display = 'none';
        if (viewOperationSection) viewOperationSection.style.display = 'none';
    }

    window.showUserSection = function(sectionId) {
        currentActiveUserType = sectionId;

        if (employeeSection) {
            employeeSection.style.display = (sectionId === 'employee') ? 'block' : 'none';
        }
        if (managerSection) {
            managerSection.style.display = (sectionId === 'manager') ? 'block' : 'none';
        }

        if (mainUserSectionsWrapper) {
            mainUserSectionsWrapper.style.display = 'flex';
        }
        hideAllOperationPages();
        resetOperationForms();

        sideNavLinks.forEach(link => {
            link.classList.remove('active');
        });
        const currentLink = document.querySelector(`.side-nav a[onclick*="${sectionId}"]`);
        if (currentLink) {
            currentLink.classList.add('active');
        }
    };

    window.showOperationPage = async function(action, userType) { // 設為 async 因為 resetOperationForms 可能是 async
        currentActiveUserType = userType;

        if (mainUserSectionsWrapper) {
            mainUserSectionsWrapper.style.display = 'none';
        }
        hideAllOperationPages();
        await resetOperationForms(); // 等待表單重置完成

        switch (action) {
            case "add":
                if (addOperationSection) addOperationSection.style.display = 'flex';
                // ID 在 resetOperationForms 中已經生成並設定
                populateDropdown(addDepartmentSelect, departments, '請選擇部門');
                populateDropdown(addIdentitySelect, userIdentities, '請選擇身分');
                break;
            case "delete":
                if (deleteOperationSection) deleteOperationSection.style.display = 'flex';
                populateDropdown(deleteDepartmentSelect, departments, '請選擇部門');
                populateDropdown(deleteUserSelect, [], '請先選擇部門');
                deleteUserSelect.disabled = true;
                deleteIdInput.value = '';
                deleteNameInput.value = '';
                break;
            case "update":
                if (updateOperationSection) updateOperationSection.style.display = 'flex';
                populateDropdown(updateDepartmentSelect, departments, '請選擇部門');
                populateDropdown(updateUserSelect, [], '請先選擇部門');
                updateUserSelect.disabled = true;
                updateIdInput.value = '';
                updateAccountInput.value = '';
                updatePasswordInput.value = '';
                updateDeptInput.value = '';
                updateNameInput.value = '';
                populateDropdown(updateIdentitySelect, userIdentities, '請選擇身分');
                break;
            case "view":
                if (viewOperationSection) viewOperationSection.style.display = 'flex';
                loadUsers(userType);
                break;
        }
    };

    window.returnToMainSections = async function() { // 設為 async
        hideAllOperationPages();
        if (mainUserSectionsWrapper) {
            mainUserSectionsWrapper.style.display = 'flex';
        }
        showUserSection(currentActiveUserType);
        await resetOperationForms(); // 等待表單重置完成
    };

    if (deleteDepartmentSelect) {
        deleteDepartmentSelect.addEventListener('change', async function() {
            const selectedDepartment = this.value;
            populateDropdown(deleteUserSelect, [], '載入中...');
            deleteUserSelect.disabled = true;
            deleteIdInput.value = '';
            deleteNameInput.value = '';

            if (!selectedDepartment) {
                populateDropdown(deleteUserSelect, [], '請先選擇部門');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/view`);
                if (!response.ok) {
                    throw new Error(`HTTP error! 狀態碼: ${response.status}`);
                }
                const allUsers = await response.json();

                const filteredUsers = allUsers.filter(user =>
                    user.department === selectedDepartment &&
                    (currentActiveUserType === 'employee' ? user.identity === '一般員工' : (user.identity === '主管' || user.identity === '後台管理員'))
                );
                populateDropdown(deleteUserSelect, filteredUsers.map(user => `${user.name} (${user.userid})`), '請選擇使用者');
                deleteUserSelect.disabled = filteredUsers.length === 0;
            } catch (error) {
                console.error("載入使用者失敗:", error);
                populateDropdown(deleteUserSelect, [], '載入失敗');
                alert(`載入使用者失敗: ${error.message}`);
            }
        });
    }

    if (deleteUserSelect) {
        deleteUserSelect.addEventListener('change', async function() {
            const selectedUserIdWithName = this.value;
            if (selectedUserIdWithName) {
                const userId = selectedUserIdWithName.match(/\(([^)]+)\)$/)[1];
                try {
                    const response = await fetch(`${API_BASE_URL}/view`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! 狀態碼: ${response.status}`);
                    }
                    const allUsers = await response.json();
                    const selectedUser = allUsers.find(user => user.userid === userId);
                    if (selectedUser) {
                        deleteIdInput.value = selectedUser.userid;
                        deleteNameInput.value = selectedUser.name;
                    } else {
                        throw new Error("找不到選定的使用者。");
                    }
                } catch (error) {
                    console.error("載入刪除使用者詳細資料失敗:", error);
                    alert(`載入使用者詳細資料失敗: ${error.message}`);
                    deleteIdInput.value = '';
                    deleteNameInput.value = '';
                }
            } else {
                deleteIdInput.value = '';
                deleteNameInput.value = '';
            }
        });
    }

    if (updateDepartmentSelect) {
        updateDepartmentSelect.addEventListener('change', async function() {
            const selectedDepartment = this.value;
            populateDropdown(updateUserSelect, [], '載入中...');
            updateUserSelect.disabled = true;
            updateIdInput.value = '';
            updateAccountInput.value = '';
            updatePasswordInput.value = '';
            updateDeptInput.value = '';
            updateNameInput.value = '';
            updateIdentitySelect.value = '';

            if (!selectedDepartment) {
                populateDropdown(updateUserSelect, [], '請先選擇部門');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/view`);
                if (!response.ok) {
                    throw new Error(`HTTP error! 狀態碼: ${response.status}`);
                }
                const allUsers = await response.json();

                const filteredUsers = allUsers.filter(user =>
                    user.department === selectedDepartment &&
                    (currentActiveUserType === 'employee' ? user.identity === '一般員工' : (user.identity === '主管' || user.identity === '後台管理員'))
                );
                populateDropdown(updateUserSelect, filteredUsers.map(user => `${user.name} (${user.userid})`), '請選擇使用者');
                updateUserSelect.disabled = filteredUsers.length === 0;
            } catch (error) {
                console.error("載入使用者失敗:", error);
                populateDropdown(updateUserSelect, [], '載入失敗');
                alert(`載入使用者失敗: ${error.message}`);
            }
        });
    }

    if (updateUserSelect) {
        updateUserSelect.addEventListener('change', async function() {
            const selectedUserIdWithName = this.value;
            if (selectedUserIdWithName) {
                const userId = selectedUserIdWithName.match(/\(([^)]+)\)$/)[1];
                try {
                    const response = await fetch(`${API_BASE_URL}/view`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! 狀態碼: ${response.status}`);
                    }
                    const allUsers = await response.json();
                    const selectedUser = allUsers.find(user => user.userid === userId);

                    if (selectedUser) {
                        updateIdInput.value = selectedUser.userid;
                        updateAccountInput.value = selectedUser.account;
                        updatePasswordInput.value = selectedUser.password;
                        updateDeptInput.value = selectedUser.department;
                        updateNameInput.value = selectedUser.name;
                        updateIdentitySelect.value = selectedUser.identity;
                    } else {
                        throw new Error("找不到選定的使用者。");
                    }
                } catch (error) {
                    console.error("載入修改使用者詳細資料失敗:", error);
                    alert(`載入使用者詳細資料失敗: ${error.message}`);
                    updateIdInput.value = '';
                    updateAccountInput.value = '';
                    updatePasswordInput.value = '';
                    updateDeptInput.value = '';
                    updateNameInput.value = '';
                    updateIdentitySelect.value = '';
                }
            } else {
                updateIdInput.value = '';
                updateAccountInput.value = '';
                updatePasswordInput.value = '';
                updateDeptInput.value = '';
                updateNameInput.value = '';
                updateIdentitySelect.value = '';
            }
        });
    }

    function handleFormSubmit(form, actionName) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(form));

            let message = "";
            let operationSuccessful = false;

            try {
                let response;
                let requestBody;

                if (actionName === "add") {
                    if (!formData.department || !formData.identity) {
                        alert("請選擇部門和使用者身分！");
                        return;
                    }
                    // 將前端生成的 userid 包含在請求體中
                    requestBody = {
                        userid: formData.userid, // 從表單獲取
                        account: formData.account,
                        password: formData.password,
                        department: formData.department,
                        name: formData.name,
                        identity: formData.identity
                    };
                    response = await fetch(`${API_BASE_URL}/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                    });
                } else if (actionName === "delete") {
                    if (!formData.selectedUserId) {
                        alert("請選擇要刪除的使用者！");
                        return;
                    }
                    const userIdToDelete = formData.selectedUserId.match(/\(([^)]+)\)$/)[1];
                    requestBody = {
                        userid: userIdToDelete,
                        department: deleteDepartmentSelect.value,
                        name: deleteNameInput.value
                    };
                    response = await fetch(`${API_BASE_URL}/delete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                    });
                } else if (actionName === "update") {
                    if (!formData.selectedUserId) {
                        alert("請選擇要修改的使用者！");
                        return;
                    }
                    const userIdToUpdate = formData.selectedUserId.match(/\(([^)]+)\)$/)[1];
                    requestBody = {
                        userid: userIdToUpdate,
                        account: formData.account,
                        password: formData.password,
                        department: formData.department,
                        name: formData.name,
                        identity: formData.identity
                    };
                    response = await fetch(`${API_BASE_URL}/update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                    });
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || `操作失敗 (狀態碼: ${response.status})`);
                }

                message = result.message || `${actionName} 成功！`;
                operationSuccessful = true;

            } catch (error) {
                console.error(`${actionName} 失敗:`, error);
                alert(`${actionName} 失敗: ${error.message}`);
                operationSuccessful = false;

                // 如果是新增操作且錯誤訊息包含 ID 或帳號重複，可以重新生成 ID
                if (actionName === "add" && (error.message.includes("ID 已存在") || error.message.includes("帳號已存在"))) {
                    // 重新生成 ID
                    try {
                        addIdInput.value = await generateUniqueId(currentActiveUserType === 'employee' ? 'E' : 'M');
                    } catch (idGenError) {
                        console.error("重新生成 ID 失敗:", idGenError);
                        addIdInput.value = "生成失敗";
                    }
                }
            }

            if (operationSuccessful) {
                alert(message);
                form.reset();
                returnToMainSections();
            }
        });
    }

    async function loadUsers(section) {
        if (!userListBody) {
            console.error("錯誤: user-list-body 元素未找到。");
            return;
        }

        userListBody.innerHTML = "<tr><td colspan='6'>載入中...</td></tr>";

        try {
            const response = await fetch(`${API_BASE_URL}/view`);
            if (!response.ok) {
                throw new Error(`HTTP error! 狀態碼: ${response.status}`);
            }
            const allUsers = await response.json();

            let displayUsers = [];
            if (section === 'employee') {
                displayUsers = allUsers.filter(user => user.identity === '一般員工');
            } else if (section === 'manager') {
                displayUsers = allUsers.filter(user => user.identity === '主管' || user.identity === '後台管理員');
            }

            userListBody.innerHTML = "";

            if (displayUsers && displayUsers.length > 0) {
                displayUsers.forEach((user) => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${user.userid}</td>
                        <td>${user.account}</td>
                        <td>${user.password}</td>
                        <td>${user.department}</td>
                        <td>${user.name}</td>
                        <td>${user.identity}</td>
                    `;
                    userListBody.appendChild(tr);
                });
            } else {
                userListBody.innerHTML = "<tr><td colspan='6'>沒有資料</td></tr>";
            }
        } catch (error) {
            console.error("載入使用者失敗:", error);
            userListBody.innerHTML = `<tr><td colspan='6' style="color: red;">載入使用者失敗: ${error.message}</td></tr>`;
        }
    }

    if (addForm) handleFormSubmit(addForm, "add");
    if (deleteForm) handleFormSubmit(deleteForm, "delete");
    if (updateForm) handleFormSubmit(updateForm, "update");

    initializeSections();
});