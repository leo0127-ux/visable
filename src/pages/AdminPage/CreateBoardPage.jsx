import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Upload, message, Card, Typography, Alert, Spin, Switch } from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined, 
  CheckCircleOutlined,
  TeamOutlined,
  MessageOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import supabase from '../../services/supabase/supabaseClient';
import './CreateBoardPage.scss';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateBoardPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadedIconUrl, setUploadedIconUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [createChat, setCreateChat] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        
        if (!user) {
          message.error('请先登录');
          navigate('/');
          return;
        }
        
        // Check if user is admin
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (userError) throw userError;
        
        if (userData.role !== 'admin') {
          message.error('只有管理员才能创建板块');
          navigate('/');
          return;
        }
        
        setIsAdmin(true);
      } catch (err) {
        console.error('Error checking admin status:', err);
        message.error('验证身份时出错');
        navigate('/');
      }
    };
    
    checkAdmin();
  }, [navigate]);

  const handleIconChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
    }
    
    const isLessThan2MB = file.size / 1024 / 1024 < 2;
    if (!isLessThan2MB) {
      message.error('图片大小不能超过2MB!');
    }
    
    return isImage && isLessThan2MB;
  };

  const handleCustomUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    
    try {
      setLoading(true);
      
      // Upload to Supabase storage
      const fileName = `board-icon-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { data, error } = await supabase.storage
        .from('board-icons')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('board-icons')
        .getPublicUrl(data.path);
        
      setUploadedIconUrl(urlData.publicUrl);
      onSuccess('ok');
    } catch (err) {
      console.error('Error uploading board icon:', err);
      message.error('上传图标失败');
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    if (!isAdmin) {
      message.error('只有管理员才能创建板块');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .insert({
          name: values.name,
          description: values.description,
          category: values.category,
          created_by: user.id,
          icon_url: values.iconEmoji || uploadedIconUrl,
          is_public: true
        })
        .select()
        .single();
        
      if (boardError) throw boardError;
      
      // Auto-create group chat if option is selected
      if (createChat) {
        const { data: chatData, error: chatError } = await supabase
          .from('chat_rooms')
          .insert({
            name: `${values.name} 讨论组`,
            type: 'group',
            created_by: user.id,
            board_id: boardData.id,
            description: `关于 ${values.name} 的群组讨论`,
            participants: [user.id]
          })
          .select()
          .single();
          
        if (chatError) {
          console.error('Error creating chat room:', chatError);
          message.warning('板块创建成功，但群聊创建失败');
        } else {
          // Add creator as participant
          const { error: participantError } = await supabase
            .from('chat_participants')
            .insert({
              chat_room_id: chatData.id,
              user_id: user.id,
              user_email: user.email,
              role: 'admin'
            });
            
          if (participantError) {
            console.error('Error adding chat participant:', participantError);
          }
        }
      }
      
      setSuccessMessage(`板块「${values.name}」创建成功!`);
      message.success('板块创建成功!');
      
      // Reset form
      form.resetFields();
      setFileList([]);
      setUploadedIconUrl('');
      
      // Navigate to the new board after 2 seconds
      setTimeout(() => {
        navigate(`/board/${boardData.id}`);
      }, 2000);
    } catch (err) {
      console.error('Error creating board:', err);
      message.error(`创建板块失败: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="create-board-page loading">
        <Spin tip="验证身份..." />
      </div>
    );
  }

  return (
    <div className="create-board-page">
      <Card className="create-board-card">
        <Title level={2} className="page-title">创建新板块</Title>
        <Text className="page-description">
          板块是用户讨论特定话题的地方。创建板块后，任何用户都可以加入讨论。
        </Text>
        
        {successMessage && (
          <Alert
            message="创建成功"
            description={successMessage}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            className="success-alert"
          />
        )}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="create-board-form"
        >
          <Form.Item
            name="name"
            label="板块名称"
            rules={[{ required: true, message: '请输入板块名称' }]}
          >
            <Input placeholder="例如: 技术交流、求职经验、生活分享" maxLength={30} />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="板块描述"
            rules={[{ required: true, message: '请输入板块描述' }]}
          >
            <TextArea 
              placeholder="描述这个板块的主题和用途..." 
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={200}
              showCount
            />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="板块分类"
            rules={[{ required: true, message: '请选择板块分类' }]}
          >
            <Select placeholder="选择板块分类">
              <Option value="career">职业发展</Option>
              <Option value="technology">技术交流</Option>
              <Option value="lifestyle">生活分享</Option>
              <Option value="education">教育学习</Option>
              <Option value="finance">财务规划</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="iconType"
            label="板块图标"
            initialValue="emoji"
          >
            <Select>
              <Option value="emoji">使用Emoji</Option>
              <Option value="upload">上传图标</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.iconType !== currentValues.iconType
            }
          >
            {({ getFieldValue }) => 
              getFieldValue('iconType') === 'emoji' ? (
                <Form.Item
                  name="iconEmoji"
                  label="选择Emoji"
                  rules={[{ required: true, message: '请选择一个Emoji' }]}
                >
                  <Input placeholder="输入一个Emoji表情, 例如: 📚 💻 🎓 💡" />
                </Form.Item>
              ) : (
                <Form.Item
                  name="iconUpload"
                  label="上传图标"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => {
                    if (Array.isArray(e)) {
                      return e;
                    }
                    return e && e.fileList;
                  }}
                >
                  <Upload
                    name="icon"
                    listType="picture-card"
                    fileList={fileList}
                    beforeUpload={beforeUpload}
                    onChange={handleIconChange}
                    customRequest={handleCustomUpload}
                    maxCount={1}
                  >
                    {fileList.length >= 1 ? null : (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>上传</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
              )
            }
          </Form.Item>
          
          <Form.Item 
            label={
              <span>
                <TeamOutlined /> 自动创建群聊
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  为该板块创建群聊，任何用户都可以加入讨论
                </Text>
              </span>
            }
            name="createChat"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch
              checked={createChat}
              onChange={(checked) => setCreateChat(checked)}
              checkedChildren={<MessageOutlined />}
            />
          </Form.Item>
          
          <Form.Item className="form-actions">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
              icon={<PlusOutlined />}
              className="submit-btn"
            >
              创建板块
            </Button>
            <Button htmlType="button" onClick={() => navigate(-1)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateBoardPage;
