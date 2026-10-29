// デモデータを初期状態に戻すスクリプト（npm run reset-data）
// data/db.json を削除すると、次回アクセス時にデモデータが自動作成されます。
import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "data", "db.json");
if (fs.existsSync(file)) {
  fs.unlinkSync(file);
  console.log("データを削除しました。次回アクセス時にデモデータが再作成されます。");
} else {
  console.log("データファイルはありません。次回アクセス時にデモデータが作成されます。");
}
