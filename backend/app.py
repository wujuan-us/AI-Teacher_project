from __future__ import annotations

import json
import mimetypes
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
STATIC_DIR = FRONTEND_DIR / "static"

ANSWER_MAP = [
    {"keywords": ["你好", "嗨", "哈喽"], "answer": "你好呀！我是智小象，很高兴为你服务😊"},
    {"keywords": ["在吗", "在不在"], "answer": "我在呢！有什么可以帮你的吗？"},
    {"keywords": ["谢谢", "感谢"], "answer": "不客气～能帮到你就好！"},
    {"keywords": ["再见", "拜拜"], "answer": "再见！有问题随时来找我哦～"},
    {"keywords": ["早上好"], "answer": "早上好！今天有早八课吗？记得吃早餐哦🥪"},
    {"keywords": ["晚上好"], "answer": "晚上好！一天辛苦啦，早点休息哦🌙"},
    {"keywords": ["奖学金"], "answer": "奖学金一般分为国家奖学金、校级奖学金、社会奖学金等。申请条件通常包括成绩排名、综测分数、无挂科、品德良好等，每年9-10月申请。"},
    {"keywords": ["助学金"], "answer": "助学金用于帮助家庭经济困难学生，需要提供贫困认定材料，申请时间一般每学年秋季学期，审核通过后按月发放。"},
    {"keywords": ["请假"], "answer": "请假流程：1.在校园系统提交申请 2.选择请假类型 3.填写时间和原因 4.辅导员审批 5.审批通过即可。"},
    {"keywords": ["挂科"], "answer": "挂科后会安排补考，补考时间一般在下学期前两周，补考仍不过需要重修，重修需要缴费并跟下一届上课。"},
    {"keywords": ["重修"], "answer": "重修流程：1.登录教务系统 2.选择重修课程 3.缴费 4.按课表上课 5.参加考试。"},
    {"keywords": ["转专业"], "answer": "转专业一般在大一下学期申请，要求成绩无挂科、通过笔试面试、接收学院同意即可。"},
    {"keywords": ["宿舍报修"], "answer": "宿舍报修可以在校园服务小程序提交，选择水电/家具/网络问题，填写宿舍号，后勤会在24小时内处理。"},
    {"keywords": ["晚自习"], "answer": "晚自习一般19:00-21:00，部分院系要求签到，缺勤会影响综测分数。"},
    {"keywords": ["四六级"], "answer": "英语四六级每年考2次，6月和12月，提前3个月报名，必须在校学生才能报考。"},
    {"keywords": ["考研"], "answer": "考研时间一般在12月，流程包括报名、现场确认、初试、复试、录取，大三下开始准备最合适。"},
    {"keywords": ["毕业"], "answer": "毕业需要修满学分、通过毕业论文、无挂科、完成实习、通过答辩，满足所有要求才能拿到毕业证和学位证。"},
    {"keywords": ["心理", "心理健康"], "answer": "学校有心理咨询中心，提供免费一对一咨询，也可以随时找我倾诉哦～"},
    {"keywords": ["一卡通"], "answer": "校园一卡通可用于食堂消费、图书馆借阅、门禁通行，充值可在校园圈存机或线上小程序操作，丢失可到一卡通中心补办。"},
]

DEFAULT_ANSWER = "你好，我不太懂你的意思，你可以换个方式问我哦~"


def build_answer(message: str, mode: str | None = None) -> str:
    normalized = (message or "").strip().lower()
    if not normalized:
        return DEFAULT_ANSWER

    for item in ANSWER_MAP:
        if any(keyword in normalized for keyword in item["keywords"]):
            return item["answer"]

    return DEFAULT_ANSWER


class AppHandler(BaseHTTPRequestHandler):
    server_version = "StudentAICounselorHTTP/1.0"

    def _send_json(self, payload: dict, status: int = HTTPStatus.OK) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_file(self, file_path: Path) -> None:
        if not file_path.exists() or not file_path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return

        mime_type, _ = mimetypes.guess_type(str(file_path))
        mime_type = mime_type or "application/octet-stream"
        data = file_path.read_bytes()

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", f"{mime_type}; charset=utf-8" if mime_type.startswith("text/") or mime_type == "application/javascript" else mime_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/":
            self._send_file(FRONTEND_DIR / "index.html")
            return

        if path == "/api/health":
            self._send_json({"status": "ok"})
            return

        if path.startswith("/static/"):
            relative_path = path.removeprefix("/static/")
            safe_path = (STATIC_DIR / relative_path).resolve()
            if STATIC_DIR.resolve() not in safe_path.parents and safe_path != STATIC_DIR.resolve():
                self.send_error(HTTPStatus.FORBIDDEN, "Forbidden")
                return
            self._send_file(safe_path)
            return

        self.send_error(HTTPStatus.NOT_FOUND, "Not found")

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path != "/api/chat":
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length) if content_length > 0 else b""

        try:
            payload = json.loads(raw_body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON payload"}, status=HTTPStatus.BAD_REQUEST)
            return

        message = str(payload.get("message", "")).strip()
        mode = str(payload.get("mode", "expert")).strip()

        self._send_json({
            "answer": build_answer(message, mode),
            "mode": mode,
        })

    def log_message(self, format: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {self.address_string()} - {format % args}")


def run(host: str = "0.0.0.0", port: int = 5000) -> None:
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"Server running at http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
