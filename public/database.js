// database.js

document.addEventListener('DOMContentLoaded', () => {
    // 處理登出按鈕
    document.getElementById("logout-btn").addEventListener("click", () => {
        // alert('您已登出！'); // 保持靜默登出導向
        window.location.href = "index.html"; // 導向到登入頁面
    });

    // 頁面加載時，預設顯示主資料庫專區
    showSection('main');
});

/**
 * 根據傳入的 sectionId 顯示對應的區塊，並隱藏其他區塊。
 * @param {string} sectionId 要顯示的區塊 ID ('main', 'add', 'delete', 'edit', 'view')
 */
function showSection(sectionId) {
    // 隱藏所有操作頁面
    document.querySelectorAll('.operation-page').forEach(page => {
        page.style.display = 'none';
    });

    // 隱藏主資料庫專區
    document.getElementById('main-database-section').style.display = 'none';

    // 根據 sectionId 顯示對應的區塊
    if (sectionId === 'main') {
        document.getElementById('main-database-section').style.display = 'flex'; // 使用 flex 佈局
    } else {
        // 顯示特定的操作頁面，並確保它是 flex 佈局
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.style.display = 'flex'; // 使用 flex 佈局
        }

        // 如果是查看模式，則載入資料
        if (sectionId === 'view') {
            loadViewData();
        }
    }
}

/**
 * 用於從操作頁面返回主資料庫專區。
 */
function returnToMainDatabaseSection() {
    // 隱藏所有操作頁面
    document.querySelectorAll('.operation-page').forEach(page => {
        page.style.display = 'none';
    });
    // 顯示主資料庫專區
    document.getElementById('main-database-section').style.display = 'flex';
}

// 載入查看資料
async function loadViewData() {
    const container = document.getElementById("view-results");
    container.innerHTML = "載入中...";

    try {
        const res = await fetch("/api/law/view");
        if (!res.ok) throw new Error(`HTTP 錯誤：${res.status}`);

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = "<p>目前沒有任何法條資料。</p>";
            return;
        }

        let html = `<table>
            <thead><tr>
                <th>Data ID</th><th>法條</th><th>關鍵字</th>
            </tr></thead><tbody>`;

        data.forEach(item => {
            html += `<tr>
                <td>${item.dataID}</td>
                <td>${item.law}</td>
                <td>${item.keywords}</td>
            </tr>`;
        });
        html += "</tbody></table>";

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<p>取得資料失敗，請稍後再試。<br>錯誤：${error.message}</p>`;
    }
}

// 新增、刪除、修改表單事件監聽
document.getElementById("add-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleFormSubmit(e.target, "/api/law/add", "新增");
});

document.getElementById("delete-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleFormSubmit(e.target, "/api/law/delete", "刪除");
});

document.getElementById("edit-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleFormSubmit(e.target, "/api/law/update", "修改");
});

async function handleFormSubmit(form, url, actionName) {
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.textContent = "處理中...";
    submitBtn.disabled = true;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();

        if (res.ok) {
            alert(`${actionName}成功！`);
            form.reset();
            // 提交成功後，返回主資料庫專區
            returnToMainDatabaseSection();
        } else {
            alert(`${actionName}失敗：${result.error || "未知錯誤"}`);
        }
    } catch (error) {
        alert(`連線錯誤：${error.message || "無法連接伺服器"}`);
    } finally {
        submitBtn.textContent = actionName;
        submitBtn.disabled = false;
    }
}