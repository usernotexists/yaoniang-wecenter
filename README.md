# yaoniang-wecenter
 基于pincong/pincong-wecenter修改的简化版WeCenter
 
## 安装方法
- 所需环境：PHP5.2.2以上？（来自官方安装程序，这个版本不一定准确），Mysql5
- 解压程序至你的网站根目录
- 复制 system/config.inc.php.sample.php 至 system/config.inc.php
- 编辑 system/config.inc.php 修改加密 KEY, 填入随机字符串
- 复制 system/config/database.php.sample.php 至 system/config/database.php
- 编辑 system/config/database.php 与你的 mysql 相对应
- 先后导入 install/db/tables.sql,  install/db/settings.sql 至 mysql
- 默认管理员账号与密码：admin

## 备注
- 由于原项目没有license，不知道原项目作者是否允许用来自己做站？
