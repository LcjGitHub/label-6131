"""棋类分类 CRUD API 测试。"""

from __future__ import annotations

import pytest


BASE_URL = "/api/categories"


def _create_category(client, name: str = "测试分类"):
    """辅助函数：创建分类。"""
    return client.post(BASE_URL, json={"name": name})


class TestCreateCategory:
    """创建分类接口测试。"""

    def test_create_category_success(self, client):
        """正常创建分类后查询列表，验证数据正确性。"""
        response = _create_category(client, name="策略类")
        assert response.status_code == 201
        data = response.get_json()
        assert data["name"] == "策略类"
        assert "id" in data

        category_id = data["id"]
        list_response = client.get(BASE_URL)
        assert list_response.status_code == 200
        list_data = list_response.get_json()
        names = [item["name"] for item in list_data["items"]]
        assert "策略类" in names
        ids = [item["id"] for item in list_data["items"]]
        assert category_id in ids

    def test_create_category_duplicate_name_error(self, client):
        """重复名称创建应返回 409 错误。"""
        _create_category(client, name="益智类")

        response = _create_category(client, name="益智类")
        assert response.status_code == 409
        data = response.get_json()
        assert "error" in data
        assert "已存在" in data["error"]

    def test_create_category_empty_name_error(self, client):
        """空名称创建应返回 400 错误。"""
        response = _create_category(client, name="")
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "必填项" in data["error"]

    def test_create_category_whitespace_name_error(self, client):
        """空白名称创建应返回 400 错误。"""
        response = _create_category(client, name="   ")
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "必填项" in data["error"]

    def test_create_category_name_trimmed(self, client):
        """名称前后空格应被去除。"""
        response = _create_category(client, name="  棋牌类  ")
        assert response.status_code == 201
        data = response.get_json()
        assert data["name"] == "棋牌类"


class TestListCategories:
    """分类列表查询接口测试。"""

    @pytest.fixture(autouse=True)
    def setup_test_data(self, client):
        """准备测试数据。"""
        for i in range(15):
            _create_category(client, name=f"分类{i + 1}")

    def test_list_categories_pagination_default(self, client):
        """默认分页参数正确。"""
        response = client.get(BASE_URL)
        assert response.status_code == 200
        data = response.get_json()
        assert data["page"] == 1
        assert data["page_size"] == 10
        assert data["total"] >= 15
        assert len(data["items"]) == 10

    def test_list_categories_pagination_custom(self, client):
        """自定义分页参数正确。"""
        response = client.get(f"{BASE_URL}?page=2&page_size=5")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page"] == 2
        assert data["page_size"] == 5
        assert len(data["items"]) == 5
        names = [item["name"] for item in data["items"]]
        for i in range(1, 6):
            assert f"分类{i}" in names

    def test_list_categories_page_boundary_zero(self, client):
        """页码边界值：page=0 应自动修正为 1。"""
        response = client.get(f"{BASE_URL}?page=0")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page"] == 1

    def test_list_categories_page_boundary_negative(self, client):
        """页码边界值：负数 page 应自动修正为 1。"""
        response = client.get(f"{BASE_URL}?page=-3")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page"] == 1

    def test_list_categories_page_size_boundary_zero(self, client):
        """每页条数边界值：page_size=0 应自动修正为 1。"""
        response = client.get(f"{BASE_URL}?page_size=0")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page_size"] == 1
        assert len(data["items"]) == 1

    def test_list_categories_page_size_boundary_negative(self, client):
        """每页条数边界值：负数 page_size 应自动修正为 1。"""
        response = client.get(f"{BASE_URL}?page_size=-5")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page_size"] == 1

    def test_list_categories_page_size_boundary_max(self, client):
        """每页条数边界值：超过最大值 100 应自动修正为 100。"""
        response = client.get(f"{BASE_URL}?page_size=150")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page_size"] == 100

    def test_list_categories_page_size_boundary_min(self, client):
        """每页条数边界值：最小值 1 正常。"""
        response = client.get(f"{BASE_URL}?page_size=1")
        assert response.status_code == 200
        data = response.get_json()
        assert data["page_size"] == 1
        assert len(data["items"]) == 1

    def test_list_categories_ordered_by_id(self, client):
        """分类列表按 ID 升序排列。"""
        response = client.get(BASE_URL)
        assert response.status_code == 200
        data = response.get_json()
        ids = [item["id"] for item in data["items"]]
        assert ids == sorted(ids)


class TestDeleteCategory:
    """删除分类接口测试。"""

    def test_delete_category_success(self, client):
        """正常删除分类。"""
        create_resp = _create_category(client, name="待删除分类")
        category_id = create_resp.get_json()["id"]

        response = client.delete(f"{BASE_URL}/{category_id}")
        assert response.status_code == 200
        data = response.get_json()
        assert "message" in data
        assert "成功" in data["message"]

        list_resp = client.get(BASE_URL)
        list_data = list_resp.get_json()
        ids = [item["id"] for item in list_data["items"]]
        assert category_id not in ids

    def test_delete_category_not_found(self, client):
        """删除不存在的分类编号应返回 404 错误。"""
        response = client.delete(f"{BASE_URL}/99999")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "不存在" in data["error"]

    def test_delete_category_with_games_error(self, client):
        """删除存在关联棋类的分类应返回 400 错误。"""
        cat_resp = _create_category(client, name="有棋类的分类")
        category_id = cat_resp.get_json()["id"]

        game_data = {
            "name": "关联棋类",
            "origin": "测试",
            "summary": "测试简介",
            "difficulty": "入门",
            "category_id": category_id,
        }
        client.post("/api/games", json=game_data)

        response = client.delete(f"{BASE_URL}/{category_id}")
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "无法删除" in data["error"] or "棋类" in data["error"]

        list_resp = client.get(BASE_URL)
        list_data = list_resp.get_json()
        ids = [item["id"] for item in list_data["items"]]
        assert category_id in ids
