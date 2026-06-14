"""已读记录 API 测试。"""

from __future__ import annotations


BASE_URL = "/api/read-history"


def _create_game(client, **kwargs):
    """辅助函数：创建棋类条目。"""
    data = {
        "name": kwargs.get("name", "测试棋类"),
        "origin": kwargs.get("origin", "测试起源地"),
        "summary": kwargs.get("summary", "测试简介内容"),
        "difficulty": kwargs.get("difficulty", "入门"),
    }
    return client.post("/api/games", json=data)


class TestMarkAsRead:
    """标记已读接口测试。"""

    def test_mark_as_read_success(self, client):
        """正常标记已读成功。"""
        game_resp = _create_game(client, name="测试已读棋", origin="中国", summary="测试已读功能")
        game_id = game_resp.get_json()["id"]

        response = client.post(BASE_URL, json={"game_id": game_id})
        assert response.status_code == 201
        data = response.get_json()
        assert data["game_id"] == game_id
        assert "read_at" in data
        assert "id" in data

    def test_mark_as_read_duplicate_updates_time(self, client):
        """重复标记已读应更新时间而非报错。"""
        game_resp = _create_game(client, name="重复标记测试")
        game_id = game_resp.get_json()["id"]

        first_resp = client.post(BASE_URL, json={"game_id": game_id})
        assert first_resp.status_code == 201
        first_data = first_resp.get_json()

        import time
        time.sleep(0.1)

        second_resp = client.post(BASE_URL, json={"game_id": game_id})
        assert second_resp.status_code == 200
        second_data = second_resp.get_json()
        assert second_data["id"] == first_data["id"]
        assert second_data["read_at"] != first_data["read_at"]

    def test_mark_as_read_missing_game_id(self, client):
        """缺少 game_id 应返回 400 错误。"""
        response = client.post(BASE_URL, json={})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "game_id" in data["error"]

    def test_mark_as_read_invalid_game_id(self, client):
        """无效 game_id 格式应返回 400 错误。"""
        response = client.post(BASE_URL, json={"game_id": "abc"})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "格式不正确" in data["error"]

    def test_mark_as_read_game_not_found(self, client):
        """不存在的棋类编号应返回 404 错误。"""
        response = client.post(BASE_URL, json={"game_id": 99999})
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "不存在" in data["error"]


class TestUnmarkRead:
    """取消已读接口测试。"""

    def test_unmark_read_success(self, client):
        """正常取消已读成功。"""
        game_resp = _create_game(client, name="取消已读测试")
        game_id = game_resp.get_json()["id"]

        client.post(BASE_URL, json={"game_id": game_id})

        response = client.delete(f"{BASE_URL}/{game_id}")
        assert response.status_code == 200
        data = response.get_json()
        assert "message" in data
        assert "成功" in data["message"]

        ids_resp = client.get(f"{BASE_URL}/ids")
        ids = ids_resp.get_json()
        assert game_id not in ids

    def test_unmark_read_not_found(self, client):
        """取消未标记已读的棋类应返回 404 错误。"""
        response = client.delete(f"{BASE_URL}/99999")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "未标记" in data["error"]


class TestListReadIds:
    """获取已读 ID 列表接口测试。"""

    def test_list_read_ids_empty(self, client):
        """初始状态下已读列表为空。"""
        response = client.get(f"{BASE_URL}/ids")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_read_ids_after_mark(self, client):
        """标记已读后 ID 列表包含对应编号。"""
        game1 = _create_game(client, name="已读棋1").get_json()
        game2 = _create_game(client, name="已读棋2").get_json()

        client.post(BASE_URL, json={"game_id": game1["id"]})
        client.post(BASE_URL, json={"game_id": game2["id"]})

        response = client.get(f"{BASE_URL}/ids")
        assert response.status_code == 200
        ids = response.get_json()
        assert game1["id"] in ids
        assert game2["id"] in ids

    def test_list_read_ids_after_unmark(self, client):
        """取消已读后 ID 列表不包含对应编号。"""
        game_resp = _create_game(client, name="取消测试")
        game_id = game_resp.get_json()["id"]

        client.post(BASE_URL, json={"game_id": game_id})
        client.delete(f"{BASE_URL}/{game_id}")

        response = client.get(f"{BASE_URL}/ids")
        ids = response.get_json()
        assert game_id not in ids


class TestListReadHistory:
    """获取已读记录列表接口测试。"""

    def test_list_read_history_empty(self, client):
        """初始状态下列表为空。"""
        response = client.get(BASE_URL)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_read_history_with_game_data(self, client):
        """已读记录包含棋类详情。"""
        game_resp = _create_game(client, name="详情测试棋", origin="测试地")
        game_id = game_resp.get_json()["id"]

        client.post(BASE_URL, json={"game_id": game_id})

        response = client.get(BASE_URL)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
        assert data[0]["game_id"] == game_id
        assert data[0]["game"] is not None
        assert data[0]["game"]["name"] == "详情测试棋"
        assert data[0]["game"]["origin"] == "测试地"

    def test_list_read_history_sort_desc_default(self, client):
        """默认按已读时间倒序排列。"""
        game1 = _create_game(client, name="排序棋1").get_json()
        game2 = _create_game(client, name="排序棋2").get_json()

        import time
        client.post(BASE_URL, json={"game_id": game1["id"]})
        time.sleep(0.1)
        client.post(BASE_URL, json={"game_id": game2["id"]})

        response = client.get(BASE_URL)
        data = response.get_json()
        assert len(data) == 2
        assert data[0]["game_id"] == game2["id"]
        assert data[1]["game_id"] == game1["id"]

    def test_list_read_history_sort_asc(self, client):
        """支持按已读时间正序排列。"""
        game1 = _create_game(client, name="正序棋1").get_json()
        game2 = _create_game(client, name="正序棋2").get_json()

        import time
        client.post(BASE_URL, json={"game_id": game1["id"]})
        time.sleep(0.1)
        client.post(BASE_URL, json={"game_id": game2["id"]})

        response = client.get(f"{BASE_URL}?sort_order=asc")
        data = response.get_json()
        assert len(data) == 2
        assert data[0]["game_id"] == game1["id"]
        assert data[1]["game_id"] == game2["id"]
