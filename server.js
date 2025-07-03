const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;


// 提供 public 資料夾裡的所有靜態檔案
app.use(express.static('public'));

// 中介軟體
app.use(cors());
app.use(bodyParser.json());

// 連線 MongoDB
mongoose.connect("mongodb+srv://admin:yourStrongPassword123%21@cluster0.q4ivxbj.mongodb.net/userManagement?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB 連線錯誤："));
db.once("open", () => {
  console.log("已連線至 MongoDB");
});

// 定義 User 模型
const userSchema = new mongoose.Schema({
  userid: { type: String, required: true, unique: true },
  account: String,
  password: String,
  department: String,
  name: String,
  identity: String,
});
const User = mongoose.model("User", userSchema);



// API：登入驗證（不使用 bcrypt，直接比對純文字密碼）
app.post("/api/login", async (req, res) => {
  const { account, password } = req.body;

  try {
    const user = await User.findOne({ account });
    if (!user) return res.status(401).json({ error: "帳號不存在" });

    if (user.password !== password) {
      return res.status(401).json({ error: "密碼錯誤" });
    }

    // 登入成功，回傳身分
    res.json({ message: "登入成功", identity: user.identity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});




// ✅ API：新增使用者 (POST /api/add)
app.post("/api/add", async (req, res) => {
  try {
    // 從請求主體解構所有必要的欄位
    const { userid, account, password, department, name, identity } = req.body;

    // 後端基本驗證：檢查所有欄位是否都有值
    if (!userid || !account || !password || !department || !name || !identity) {
      return res.status(400).json({ error: "所有欄位都是必填項，請檢查！" });
    }

    // 檢查 userid 或 account 是否已存在 (使用 $or 查詢)
    const existingUser = await User.findOne({ $or: [{ userid: userid }, { account: account }] });
    if (existingUser) {
      // 根據是 userid 還是 account 重複給出更具體的錯誤訊息
      if (existingUser.userid === userid) {
        return res.status(409).json({ error: `新增失敗：使用者 ID '${userid}' 已存在。` });
      } else {
        return res.status(409).json({ error: `新增失敗：帳號 '${account}' 已存在，請使用其他帳號。` });
      }
    }

    // 創建新的使用者實例
    const newUser = new User({
      userid,
      account,
      password, // 實際應用中請對密碼進行哈希處理 (例如 bcrypt)
      department,
      name,
      identity,
    });

    // 儲存到資料庫
    await newUser.save();
    console.log("新增使用者成功：", newUser.userid); // 在伺服器控制台印出成功訊息
    res.status(201).json({ message: "新增使用者成功！", newUser: newUser }); // 返回 201 Created 狀態碼
  } catch (error) {
    // 捕獲任何儲存或資料庫操作失敗的錯誤
    console.error("新增使用者失敗:", error); // <<<<<<< 非常重要：詳細印出錯誤
    res.status(500).json({ error: "伺服器內部錯誤，新增失敗。" });
  }
});

// ✅ API：刪除使用者 (POST /api/delete)
app.post("/api/delete", async (req, res) => {
  try {
    const { userid } = req.body; // 只需要 userid 來刪除
    if (!userid) {
      return res.status(400).json({ error: "使用者 ID 是必填項，請檢查！" });
    }

    // 根據 userid 查找並刪除
    const deletedUser = await User.findOneAndDelete({ userid: userid });

    if (deletedUser) {
      console.log("刪除使用者成功：", deletedUser.userid);
      res.status(200).json({ message: "使用者刪除成功！" });
    } else {
      // 如果沒有找到符合條件的使用者
      res.status(404).json({ error: "未找到要刪除的使用者。" });
    }
  } catch (error) {
    console.error("刪除使用者失敗:", error); // <<<<<<< 詳細印出錯誤
    res.status(500).json({ error: "伺服器內部錯誤，刪除失敗。" });
  }
});

// ✅ API：修改使用者 (POST /api/update)
app.post("/api/update", async (req, res) => {
  try {
    const { userid, account, password, department, name, identity } = req.body;

    if (!userid) {
      return res.status(400).json({ error: "使用者 ID 是必填項，請檢查！" });
    }

    // 創建一個只包含要更新的字段的物件
    const updateFields = { account, password, department, name, identity };
    // 過濾掉 undefined 的欄位，避免覆蓋資料庫中現有的值
    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    // 如果嘗試修改 account 欄位，檢查新帳號是否被其他使用者佔用
    if (account) {
      const existingUserWithSameAccount = await User.findOne({
        account: account,
        userid: { $ne: userid } // 排除當前正在修改的使用者 ID
      });
      if (existingUserWithSameAccount) {
        return res.status(409).json({ error: "此帳號已被其他使用者使用，請更換帳號。" });
      }
    }

    // 查找並更新使用者
    const updatedUser = await User.findOneAndUpdate(
      { userid: userid }, // 查找條件
      { $set: updateFields }, // 設定要更新的字段
      { new: true } // 返回更新後的文件
    );

    if (updatedUser) {
      console.log("修改使用者成功：", updatedUser.userid);
      res.status(200).json({ message: "使用者修改成功！", updatedUser: updatedUser });
    } else {
      res.status(404).json({ error: "未找到要修改的使用者。" });
    }
  } catch (error) {
    console.error("修改使用者失敗:", error); // <<<<<<< 詳細印出錯誤
    res.status(500).json({ error: "伺服器內部錯誤，修改失敗。" });
  }
});

// ✅ API：查看所有使用者 (GET /api/view)
app.get("/api/view", async (req, res) => {
  try {
    const users = await User.find({}); // 查詢所有使用者
    res.status(200).json(users);
  } catch (error) {
    console.error("獲取使用者失敗:", error); // <<<<<<< 詳細印出錯誤
    res.status(500).json({ error: "伺服器內部錯誤，獲取使用者失敗。" });
  }
});


// 2. Law 模型
const lawSchema = new mongoose.Schema({
  dataID: { type: String, required: true, unique: true },
  law: { type: String, required: true },
  keywords: { type: String, required: true },
});
const Law = mongoose.model("Law", lawSchema);


// --- Law 法條管理 API ---

// 新增法條 API
app.post("/api/law/add", async (req, res) => {
  console.log("收到 /api/law/add POST 請求，內容：", req.body);
  try {
    const existingLaw = await Law.findOne({ dataID: req.body.dataID });
    if (existingLaw) {
      return res.status(400).json({ error: "此 Data ID 已存在，請使用不同的 ID。" });
    }

    const newLaw = new Law(req.body);
    await newLaw.save();
    res.status(201).json({ message: "法條新增成功！" });
  } catch (err) {
    console.error("新增法條錯誤：", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "伺服器內部錯誤，無法新增法條。" });
  }
});

// 刪除法條 API
app.post("/api/law/delete", async (req, res) => {
  try {
    const result = await Law.deleteOne({ dataID: req.body.dataID });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "找不到指定的 Data ID，無法刪除。" });
    }
    res.json({ message: "法條刪除成功！" });
  } catch (err) {
    console.error("刪除法條錯誤：", err);
    res.status(500).json({ error: err.message || "伺服器內部錯誤，無法刪除法條。" });
  }
});

// 修改法條 API
app.post("/api/law/update", async (req, res) => {
  try {
    const { dataID, law, keywords } = req.body;
    // 尋找並更新法條，如果找不到則 result.matchedCount 會是 0
    const result = await Law.updateOne({ dataID }, { law, keywords });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "找不到指定的 Data ID，無法修改。" });
    }
    res.json({ message: "法條修改成功！" });
  } catch (err) {
    console.error("修改法條錯誤：", err);
    if (err.name === 'ValidationError') { // Mongoose validation error
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || "伺服器內部錯誤，無法修改法條。" });
  }
});

// 查看所有法條 API
app.get("/api/law/view", async (req, res) => {
  try {
    const laws = await Law.find();
    res.json(laws);
  } catch (err) {
    console.error("查看所有法條錯誤：", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});




// 如果 Express 伺服器在 MongoDB 連線失敗時沒有啟動，則以下這段程式碼不會執行
// 但為了清晰起見，通常會將 app.listen() 放在 mongoose.connect() 的 .then() 中
// app.listen(PORT, () => {
//   console.log(`伺服器已啟動：http://localhost:${PORT}`);
// });


// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器已啟動：http://localhost:${PORT}`);
});
