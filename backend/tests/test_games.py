"""棋类 CRUD API 测试。"""

from __future__ import annotations

import pytest


BASE_URL = "/api/games"


def _create_game(client, **kwargs):
    """辅助函数：创建棋类条目。"""
    data = {
        "name": kwargs.get("name", "测试棋类"),
        "origin": kwargs.get("origin", "测试起源地"),
        "summary": kwargs.get("summary", "测试简介内容"),
        "difficulty": kwargs.get("difficulty", "入门"),
        "links": kwargs.get("links", ""),
        "board_size": kwargs.get("board_size", ""),
        "category_id": kwargs.get("category_id"),
    }
    return client.post(BASE_URL, json=data)


class TestCreateGame:
    """创建棋类接口测试。"""

    def test_create_game_success(self, client):
        """正常创建棋类后查询，验证数据正确性。"""
        response = _create_game(
            client,
            name="国际跳棋",
            origin="欧洲",
            summary="双方各执12枚棋子，在10x10棋盘上斜向移动，吃子必须跳过对方棋子。",
            difficulty="入门",
            board_size="10×10",
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["name"] == "国际跳棋"
        assert data["origin"] == "欧洲"
        assert data["difficulty"] == "入门"
        assert data["board_size"] == "10×10"
        assert "id" in data

        game_id = data["id"]
        get_response = client.get(f"{BASE_URL}/{game_id}")
        assert get_response.status_code == 200
        get_data = get_response.get_json()
        assert get_data["id"] == game_id
        assert get_data["name"] == "国际跳棋"
        assert get_data["origin"] == "欧洲"
        assert get_data["summary"] == "双方各执12枚棋子，在10x10棋盘上斜向移动，吃子必须跳过对方棋子。"
        assert get_data["difficulty"] == "入门"
        assert get_data["board_size"] == "10×10"

    def test_create_game_duplicate_name_error(self, client):
        """重复名称创建应返回 409 错误。"""
        _create_game(client, name="六子棋", origin="中国", summary="简单的连六棋游戏", difficulty="入门")

        response = _create_game(client, name="六子棋", origin="其他地区", summary="重复名称测试", difficulty="中等")
        assert response.status_code == 409
        data = response.get_json()
        assert "error" in data
        assert "已存在" in data["error"]

    def test_create_game_missing_required_fields(self, client):
        """必填字段缺失应返回 400 错误。"""
        response = client.post(BASE_URL, json={"name": "", "origin": "", "summary": "", "difficulty": ""})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "必填项" in data["error"]

    def test_create_game_invalid_category(self, client):
        """传入不存在的分类编号应返回错误。"""
        response = _create_game(client, name="新棋类", category_id=9999)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "不存在" in data["error"]


class TestGetGame:
    """单条棋类查询接口测试。"""

    def test_get_game_success(self, client):
        """查询存在的棋类，返回正确数据。"""
        create_resp = _create_game(client, name="西洋双陆棋", origin="中东", summary="靠运气和策略的古老游戏", difficulty="中等")
        game_id = create_resp.get_json()["id"]

        response = client.get(f"{BASE_URL}/{game_id}")
        assert response.status_code == 200
        data = response.get_json()
        assert data["id"] == game_id
        assert data["name"] == "西洋双陆棋"
        assert data["origin"] == "中东"
        assert data["difficulty"] == "中等"

    def test_get_game_not_found(self, client):
        """查询不存在的棋类编号应返回 404 错误。"""
        response = client.get(f"{BASE_URL}/99999")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "不存在" in data["error"]


class TestUpdateGame:
    """更新棋类接口测试。"""

    def test_update_game_success(self, client):
        """正常更新棋类信息。"""
        create_resp = _create_game(client, name="旧名称", origin="旧起源", summary="旧简介", difficulty="入门")
        game_id = create_resp.get_json()["id"]

        update_data = {
            "name": "新名称",
            "origin": "新起源地",
            "summary": "更新后的简介内容",
            "difficulty": "困难",
            "board_size": "8×8",
        }
        response = client.put(f"{BASE_URL}/{game_id}", json=update_data)
        assert response.status_code == 200
        data = response.get_json()
        assert data["id"] == game_id
        assert data["name"] == "新名称"
        assert data["origin"] == "新起源地"
        assert data["summary"] == "更新后的简介内容"
        assert data["difficulty"] == "困难"
        assert data["board_size"] == "8×8"

        get_resp = client.get(f"{BASE_URL}/{game_id}")
        get_data = get_resp.get_json()
        assert get_data["name"] == "新名称"
        assert get_data["difficulty"] == "困难"

    def test_update_game_not_found(self, client):
        """更新不存在的棋类编号应返回 404 错误。"""
        update_data = {
            "name": "测试",
            "origin": "测试",
            "summary": "测试",
            "difficulty": "入门",
        }
        response = client.put(f"{BASE_URL}/99999", json=update_data)
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "不存在" in data["error"]

    def test_update_game_duplicate_name_error(self, client):
        """更新为已存在的名称应返回 409 错误。"""
        _create_game(client, name="围棋")
        create_resp = _create_game(client, name="五子棋")
        game_id = create_resp.get_json()["id"]

        update_data = {
            "name": "围棋",
            "origin": "测试",
            "summary": "测试",
            "difficulty": "入门",
        }
        response = client.put(f"{BASE_URL}/{game_id}", json=update_data)
        assert response.status_code == 409
        data = response.get_json()
        assert "error" in data
        assert "已存在" in data["error"]

    def test_update_game_same_name_allowed(self, client):
        """更新时保留原名称应允许。"""
        create_resp = _create_game(client, name="军棋")
        game_id = create_resp.get_json()["id"]

        update_data = {
            "name": "军棋",
            "origin": "中国",
            "summary": "更新简介",
            "difficulty": "中等",
        }
        response = client.put(f"{BASE_URL}/{game_id}", json=update_data)
        assert response.status_code == 200
        data = response.get_json()
        assert data["name"] == "军棋"
        assert data["summary"] == "更新简介"


class TestDeleteGame:
    """删除棋类接口测试。"""

    def test_delete_game_success(self, client):
        """正常删除棋类。"""
        create_resp = _create_game(client, name="待删除棋类")
        game_id = create_resp.get_json()["id"]

        response = client.delete(f"{BASE_URL}/{game_id}")
        assert response.status_code == 200
        data = response.get_json()
        assert "message" in data
        assert "成功" in data["message"]

        get_resp = client.get(f"{BASE_URL}/{game_id}")
        assert get_resp.status_code == 404

    def test_delete_game_not_found(self, client):
        """删除不存在的棋类编号应返回 404 错误。"""
        response = client.delete(f"{BASE_URL}/99999")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "不存在" in data["error"]


class TestBatchDeleteGames:
    """批量删除棋类接口测试。"""

    def test_batch_delete_success(self, client):
        """批量删除棋类成功，同步清理收藏记录。"""
        game1 = _create_game(client, name="批量删除1").get_json()
        game2 = _create_game(client, name="批量删除2").get_json()
        game3 = _create_game(client, name="批量删除3").get_json()

        client.post("/api/favorites", json={"game_id": game1["id"]})
        client.post("/api/favorites", json={"game_id": game2["id"]})

        response = client.delete(f"{BASE_URL}/batch", json={"ids": [game1["id"], game2["id"], game3["id"]]})
        assert response.status_code == 200
        data = response.get_json()
        assert data["success_count"] == 3
        assert data["failed"] == []
        assert "成功删除 3 个棋类" in data["message"]

        for gid in [game1["id"], game2["id"], game3["id"]]:
            assert client.get(f"{BASE_URL}/{gid}").status_code == 404

        fav_resp = client.get("/api/favorites/ids")
        fav_ids = fav_resp.get_json()
        assert game1["id"] not in fav_ids
        assert game2["id"] not in fav_ids

    def test_batch_delete_partial_failure(self, client):
        """部分棋类不存在时，成功删除存在的，返回失败列表。"""
        game1 = _create_game(client, name="部分删除1").get_json()
        game2 = _create_game(client, name="部分删除2").get_json()

        response = client.delete(f"{BASE_URL}/batch", json={"ids": [game1["id"], 99999, game2["id"], 88888]})
        assert response.status_code == 200
        data = response.get_json()
        assert data["success_count"] == 2
        assert len(data["failed"]) == 2
        failed_ids = [f["id"] for f in data["failed"]]
        assert 99999 in failed_ids
        assert 88888 in failed_ids

    def test_batch_delete_empty_ids(self, client):
        """空 ids 应返回 400 错误。"""
        response = client.delete(f"{BASE_URL}/batch", json={"ids": []})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_batch_delete_missing_ids(self, client):
        """缺少 ids 参数应返回 400 错误。"""
        response = client.delete(f"{BASE_URL}/batch", json={})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_batch_delete_invalid_ids_format(self, client):
        """ids 不是数组应返回 400 错误。"""
        response = client.delete(f"{BASE_URL}/batch", json={"ids": "not-a-list"})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_batch_delete_invalid_id_value(self, client):
        """包含无效编号值应返回 400 错误。"""
        response = client.delete(f"{BASE_URL}/batch", json={"ids": [1, "abc", 3]})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "abc" in data["error"]


class TestListGames:
    """棋类列表查询接口测试。"""

    @pytest.fixture(autouse=True)
    def setup_test_data(self, client):
        """准备测试数据。"""
        test_games = [
            {"name": "五子棋", "origin": "中国", "summary": "连成五子获胜", "difficulty": "入门"},
            {"name": "围棋", "origin": "中国", "summary": "古老的策略游戏", "difficulty": "困难"},
            {"name": "中国象棋", "origin": "中国", "summary": "流行的传统棋类", "difficulty": "中等"},
            {"name": "国际象棋", "origin": "印度/欧洲", "summary": "世界流行", "difficulty": "较难"},
            {"name": "将棋", "origin": "日本", "summary": "可打入棋子", "difficulty": "较难"},
        ]
        for game in test_games:
            _create_game(client, **game)

    def test_list_games_keyword_filter(self, client):
        """关键词筛选结果正确。"""
        response = client.get(f"{BASE_URL}?keyword=中国")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] >= 2
        names = [item["name"] for item in data["items"]]
        assert "中国象棋" in names
        assert "五子棋" in names or "围棋" in names

    def test_list_games_difficulty_filter(self, client):
        """难度筛选结果正确。"""
        response = client.get(f"{BASE_URL}?difficulty=困难")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] >= 1
        for item in data["items"]:
            assert item["difficulty"] == "困难"

    def test_list_games_keyword_and_difficulty_combined(self, client):
        """关键词与难度组合筛选结果正确。"""
        response = client.get(f"{BASE_URL}?keyword=中国&difficulty=中等")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] >= 1
        for item in data["items"]:
            assert item["difficulty"] == "中等"
            assert "中国" in item["name"] or "中国" in item["origin"] or "中国" in item["summary"]

    def test_list_games_keyword_name_match(self, client):
        """关键词匹配名称。"""
        response = client.get(f"{BASE_URL}?keyword=五子棋")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] >= 1
        names = [item["name"] for item in data["items"]]
        assert "五子棋" in names

    def test_list_games_keyword_origin_match(self, client):
        """关键词匹配起源地。"""
        response = client.get(f"{BASE_URL}?keyword=日本")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] >= 1
        origins = [item["origin"] for item in data["items"]]
        assert any("日本" in o for o in origins)

    def test_list_games_keyword_summary_match(self, client):
        """关键词匹配简介。"""
        response = client.get(f"{BASE_URL}?keyword=策略")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] >= 1
        summaries = [item["summary"] for item in data["items"]]
        assert any("策略" in s for s in summaries)

    def test_list_games_pagination_default(self, client):
        """默认分页参数正确。"""
        response = client.get(BASE_URL)
        assert response.status_code == 200
        data = response.get_json()
        assert data["page"] == 1
        assert data["page_size"] == 10

    def test_list_games_pagination_custom_page(self, client):
        """自定义页码正确。"""
        response = client.get(f"{BASE_URL}?page=2&page_size=2")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page"] == 2
        assert data["page_size"] == 2
        assert len(data["items"]) <= 2

    def test_list_games_page_boundary_zero(self, client):
        """页码边界值：page=0 应自动修正为 1。"""
        response = client.get(f"{BASE_URL}?page=0")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page"] == 1

    def test_list_games_page_boundary_negative(self, client):
        """页码边界值：负数 page 应自动修正为 1。"""
        response = client.get(f"{BASE_URL}?page=-5")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page"] == 1

    def test_list_games_page_size_boundary_zero(self, client):
        """每页条数边界值：page_size=0 应自动修正为 1。"""
        response = client.get(f"{BASE_URL}?page_size=0")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page_size"] == 1

    def test_list_games_page_size_boundary_negative(self, client):
        """每页条数边界值：负数 page_size 应自动修正为 1。"""
        response = client.get(f"{BASE_URL}?page_size=-10")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page_size"] == 1

    def test_list_games_page_size_boundary_max(self, client):
        """每页条数边界值：超过最大值 100 应自动修正为 100。"""
        response = client.get(f"{BASE_URL}?page_size=200")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page_size"] == 100

    def test_list_games_page_size_boundary_min(self, client):
        """每页条数边界值：最小值 1 正常。"""
        response = client.get(f"{BASE_URL}?page_size=1")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page_size"] == 1
        assert len(data["items"]) == 1

    def test_list_games_empty_keyword(self, client):
        """空关键词应忽略筛选。"""
        response = client.get(f"{BASE_URL}?keyword=")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] >= 5

    def test_list_games_whitespace_keyword(self, client):
        """空白关键词应忽略筛选。"""
        response = client.get(f"{BASE_URL}?keyword=%20%20")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] >= 5

    def test_list_games_empty_difficulty(self, client):
        """空难度应忽略筛选。"""
        response = client.get(f"{BASE_URL}?difficulty=")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] >= 5


class TestExportGames:
    """导出棋类接口测试。"""

    def test_export_games_success(self, client):
        """导出全部棋类，返回 JSON 文件下载。"""
        _create_game(client, name="导出测试棋1", origin="测试", summary="测试导出", difficulty="入门")
        _create_game(client, name="导出测试棋2", origin="测试", summary="测试导出", difficulty="中等")

        response = client.get(f"{BASE_URL}/export")
        assert response.status_code == 200
        assert "application/json" in response.content_type
        assert "attachment" in response.headers.get("Content-Disposition", "")

        import json
        data = json.loads(response.data)
        assert "version" in data
        assert "exported_at" in data
        assert "items" in data
        assert data["count"] >= 2
        assert len(data["items"]) >= 2

        item = data["items"][0]
        assert "name" in item
        assert "origin" in item
        assert "summary" in item
        assert "difficulty" in item
        assert "links" in item
        assert "board_size" in item
        assert "category_id" in item
        assert "id" not in item


class TestImportGames:
    """导入棋类接口测试。"""

    def test_import_games_success(self, client):
        """正常导入棋类条目。"""
        import io
        import json

        import_data = {
            "version": "1.0",
            "items": [
                {"name": "导入棋类1", "origin": "导入源", "summary": "导入摘要1", "difficulty": "入门"},
                {"name": "导入棋类2", "origin": "导入源", "summary": "导入摘要2", "difficulty": "中等", "board_size": "8×8"},
            ],
        }
        data = json.dumps(import_data, ensure_ascii=False).encode("utf-8")
        file = (io.BytesIO(data), "test-import.json")

        response = client.post(
            f"{BASE_URL}/import",
            data={"file": file},
            content_type="multipart/form-data",
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result["success_count"] == 2
        assert result["skip_count"] == 0
        assert result["failed_count"] == 0

        list_resp = client.get(f"{BASE_URL}?page_size=100")
        list_data = list_resp.get_json()
        names = [g["name"] for g in list_data["items"]]
        assert "导入棋类1" in names
        assert "导入棋类2" in names

    def test_import_duplicate_names_skipped(self, client):
        """重复名称的棋类应跳过并统计。"""
        _create_game(client, name="已存在棋类", origin="原源", summary="原摘要", difficulty="入门")

        import io
        import json

        import_data = {
            "items": [
                {"name": "已存在棋类", "origin": "新源", "summary": "新摘要", "difficulty": "中等"},
                {"name": "新增棋类", "origin": "新源", "summary": "新摘要", "difficulty": "中等"},
            ],
        }
        data = json.dumps(import_data, ensure_ascii=False).encode("utf-8")
        file = (io.BytesIO(data), "test-import.json")

        response = client.post(
            f"{BASE_URL}/import",
            data={"file": file},
            content_type="multipart/form-data",
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result["success_count"] == 1
        assert result["skip_count"] == 1

    def test_import_missing_required_fields(self, client):
        """缺失必填字段的条目应失败。"""
        import io
        import json

        import_data = {
            "items": [
                {"name": "", "origin": "源", "summary": "摘要", "difficulty": "入门"},
                {"name": "有效棋", "origin": "", "summary": "摘要", "difficulty": "入门"},
                {"name": "完整棋", "origin": "源", "summary": "摘要", "difficulty": "入门"},
            ],
        }
        data = json.dumps(import_data, ensure_ascii=False).encode("utf-8")
        file = (io.BytesIO(data), "test-import.json")

        response = client.post(
            f"{BASE_URL}/import",
            data={"file": file},
            content_type="multipart/form-data",
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result["success_count"] == 1
        assert result["failed_count"] == 2

    def test_import_no_file_error(self, client):
        """未上传文件应返回错误。"""
        response = client.post(f"{BASE_URL}/import", data={}, content_type="multipart/form-data")
        assert response.status_code == 400

    def test_import_invalid_json_error(self, client):
        """无效 JSON 文件应返回错误。"""
        import io

        data = b"not valid json {{{"
        file = (io.BytesIO(data), "bad.json")

        response = client.post(
            f"{BASE_URL}/import",
            data={"file": file},
            content_type="multipart/form-data",
        )
        assert response.status_code == 400
        result = response.get_json()
        assert "JSON" in result["error"]

    def test_import_empty_items_error(self, client):
        """空数据应返回错误。"""
        import io
        import json

        import_data = {"items": []}
        data = json.dumps(import_data).encode("utf-8")
        file = (io.BytesIO(data), "empty.json")

        response = client.post(
            f"{BASE_URL}/import",
            data={"file": file},
            content_type="multipart/form-data",
        )
        assert response.status_code == 400

    def test_import_duplicate_within_same_file_skipped(self, client):
        """同一导入文件内的重复名称也应跳过。"""
        import io
        import json

        import_data = {
            "items": [
                {"name": "重复棋", "origin": "源1", "summary": "摘要1", "difficulty": "入门"},
                {"name": "重复棋", "origin": "源2", "summary": "摘要2", "difficulty": "中等"},
            ],
        }
        data = json.dumps(import_data, ensure_ascii=False).encode("utf-8")
        file = (io.BytesIO(data), "dup.json")

        response = client.post(
            f"{BASE_URL}/import",
            data={"file": file},
            content_type="multipart/form-data",
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result["success_count"] == 1
        assert result["skip_count"] == 1

    def test_import_plain_array_format(self, client):
        """支持纯数组格式的导入数据。"""
        import io
        import json

        import_data = [
            {"name": "数组导入1", "origin": "源", "summary": "摘要", "difficulty": "入门"},
        ]
        data = json.dumps(import_data, ensure_ascii=False).encode("utf-8")
        file = (io.BytesIO(data), "array.json")

        response = client.post(
            f"{BASE_URL}/import",
            data={"file": file},
            content_type="multipart/form-data",
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result["success_count"] == 1
