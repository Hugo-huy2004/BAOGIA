// Slide chỉ có ở một ngôn ngữ: điều kiện riêng của nước sở tại (công cụ hay dùng,
// luật hosting). Viết thẳng bằng ngôn ngữ đó, không qua máy dịch. `after` = chèn
// sau slide số mấy của bản gốc (đếm từ 0) — chỉ số gốc giữ nguyên để bản dịch khớp.
export const EXTRA_SLIDES = {
  zh: {
    step7: [{
      after: 8,
      slide: {
        section: "research",
        title: "在中国大陆：也可以用 phpStudy（小皮面板）",
        body: `apachefriends.org 和 SourceForge 在中国大陆下载常常很慢甚至打不开。国内最常用的替代品是 **phpStudy（小皮面板）**，官网 \`www.xp.cn\`，Windows 版免费。

| | XAMPP | phpStudy |
|---|---|---|
| 网站根目录 | \`C:\\xampp\\htdocs\` | \`D:\\phpstudy_pro\\WWW\` |
| 启动服务 | Control Panel → Start | 首页 → Apache、MySQL → 启动 |
| phpMyAdmin | 自带，\`http://localhost/phpmyadmin\` | 软件管理 → 网站程序 → 安装 phpMyAdmin，再从「数据库工具」打开 |
| MySQL 的 root 密码 | 空 | 默认 \`root\` |

后面所有步骤照做即可，只需记住两点：把 \`nhip/\` 放进 \`WWW\` 而不是 \`htdocs\`；第 11 步写 \`config.php\` 时，数据库密码填 phpStudy 里设置的那个（默认 \`root\`），不是空字符串。`,
      },
    }],
    step24: [{
      after: 4,
      slide: {
        section: "research",
        title: "在中国大陆上线：ICP 备案",
        body: `按中国法规，网站如果放在**中国大陆的服务器**上并用自己的域名对外访问，必须先通过服务器提供商办理 **ICP 备案**，备案通过前服务商不会放行 80/443 端口。备案一般需要身份证明和几周时间。

本课用的 InfinityFree 等免费主机在境外，不需要备案；代价是在中国大陆访问可能较慢或不稳定。学习和作品展示用境外免费主机即可；真正面向国内用户运营时，再选国内服务器并办理备案。

> 中华人民共和国国务院 (2000)《互联网信息服务管理办法》；工业和信息化部 ICP/IP 地址/域名信息备案管理系统：https://beian.miit.gov.cn/`,
      },
    }],
  },
};
