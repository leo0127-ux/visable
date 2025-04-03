import React, { useState } from "react";
import { Dropdown, Button, Menu } from "antd";
import { DownOutlined } from "@ant-design/icons";

const FilterButton = ({ label, options, onSelect }) => {
  const [selectedValue, setSelectedValue] = useState(null);

  const handleMenuClick = ({ key }) => {
    setSelectedValue(key);
    onSelect(key);
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      {options.map((option) => (
        <Menu.Item key={option.value}>{option.label}</Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      <Button>
        {label} <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default FilterButton;
