import { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Input,
  List,
  Modal,
  Pagination,
  Popconfirm,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

import { createCategory, deleteCategory, fetchCategories } from '../api/client';
import type { Category, CategoryPayload } from '../types/game';

const { Paragraph, Text } = Typography;

/** 分类管理页 */
export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<CategoryPayload>();

  const loadCategories = async (p = page, ps = pageSize) => {
    setLoading(true);
    try {
      const data = await fetchCategories(p, ps);
      setCategories(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.page_size);
    } catch {
      message.error('加载分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await createCategory(values);
      message.success('创建成功');
      setModalOpen(false);
      await loadCategories(1, pageSize);
    } catch (err) {
      if (axiosIsError(err)) {
        message.error(err.response?.data?.error ?? '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      message.success('删除成功');
      const newTotal = total - 1;
      const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = Math.min(page, maxPage);
      await loadCategories(targetPage, pageSize);
    } catch (err) {
      if (axiosIsError(err)) {
        message.error(err.response?.data?.error ?? '删除失败');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">共 {total} 个分类</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增分类
        </Button>
      </Space>

      <List
        itemLayout="vertical"
        dataSource={categories}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <Popconfirm
                key="delete"
                title="确定删除该分类？"
                onConfirm={() => handleDelete(item.id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={<span style={{ fontSize: 16 }}>{item.name}</span>}
              description={
                <Text type="secondary">
                  编号：{item.id}
                </Text>
              }
            />
            <Paragraph style={{ marginBottom: 0 }}>
              <Text type="secondary">
                创建时间：{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
              </Text>
            </Paragraph>
          </List.Item>
        )}
      />

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          showQuickJumper
          showTotal={(t) => `共 ${t} 条`}
          onChange={(p, ps) => loadCategories(p, ps)}
        />
      </div>

      <Modal
        title="新增分类"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnHidden
        width={400}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="例如：连子类" maxLength={50} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

/**
 * 判断是否为 axios 错误
 * @param err - 未知错误
 */
function axiosIsError(err: unknown): err is { response?: { data?: { error?: string } } } {
  return typeof err === 'object' && err !== null && 'response' in err;
}
