// Standard code templates for learning languages
export const TEMPLATES = {
  c: `// Khóa học cơ bản C - OOP struct simulation
#include <stdio.h>
#include <string.h>

// Struct mô phỏng Class trong C
struct Student {
    char name[50];
    int age;
    void (*study)(struct Student*);
};

void studentStudy(struct Student* s) {
    printf("Sinh viên %s (%d tuổi) đang học Lập trình Hướng đối tượng!\\n", s->name, s->age);
}

int main() {
    struct Student s1;
    strcpy(s1.name, "Hùng");
    s1.age = 20;
    s1.study = studentStudy;

    s1.study(&s1);
    return 0;
}`,
  cpp: `// Khóa học cơ bản C++ - Polymorphism & Inheritance
#include <iostream>
#include <vector>
using namespace std;

// Base Class (Lớp cha)
class Person {
protected:
    string name;
public:
    Person(string n) : name(n) {}
    virtual void showRole() {
        cout << name << " là một thành viên trong trường học." << endl;
    }
    virtual ~Person() {}
};

// Derived Class (Lớp con)
class Student : public Person {
private:
    string major;
public:
    Student(string n, string m) : Person(n), major(m) {}
    void showRole() override {
        cout << name << " là Sinh viên ngành " << major << endl;
    }
};

int main() {
    // Đa hình
    Person* p = new Student("An", "Software Engineering");
    p->showRole();
    delete p;
    return 0;
}`,
  csharp: `// Khóa học cơ bản C# - OOP Encapsulation & Properties
using System;

namespace OOP_Learning
{
    public class BankAccount
    {
        // Thuộc tính đóng gói
        private string accountHolder;
        private double balance;

        public BankAccount(string holder, double initialBalance)
        {
            accountHolder = holder;
            balance = initialBalance > 0 ? initialBalance : 0;
        }

        public double Balance { get { return balance; } }

        public void Deposit(double amount)
        {
            if (amount > 0) balance += amount;
        }
    }
}`,
  python: `# Khóa học cơ bản Python - OOP Classes & Inheritance
class Vehicle:
    def __init__(self, brand):
        self.brand = brand
    def drive(self):
        print(f"Xe {self.brand} đang lăn bánh...")

class Car(Vehicle):
    def __init__(self, brand, model):
        super().__init__(brand)
        self.model = model
    def drive(self):
        print(f"Xe {self.brand} {self.model} đang phóng nhanh trên cao tốc!")

if __name__ == "__main__":
    my_car = Car("VinFast", "VF8")
    my_car.drive()
`,
  html: `<!-- Khóa học cơ bản HTML/CSS/JS -->
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Dự Án Web Mini</title>
</head>
<body>
    <h1>Chào mừng bạn đến với Web-based IDE!</h1>
    <script>
        console.log("Web loaded!");
    </script>
</body>
</html>`,
  php: `<?php
// Khóa học cơ bản PHP - OOP Database model
class Database {
    private $host = "localhost";
    public function connect() {
        return "Connected to " . $this->host;
    }
}
$db = new Database();
echo $db->connect();
?>`
};

export const INITIAL_WORKSPACE = [
  {
    path: "README.md",
    name: "README.md",
    language: "markdown",
    content: `# 🎓 SOFTWARE ENGINEERING - MÔI TRƯỜNG HỌC TẬP OOP
Chào mừng bạn đến với Web-based IDE!

Môi trường này được cấu trúc sẵn các bài học Lập trình hướng đối tượng (OOP) chuyên sâu:
1. **Đóng gói (Encapsulation)**: Xem ví dụ trong \`src/oop/BankAccount.cs\`
2. **Kế thừa (Inheritance)**: Xem ví dụ trong \`src/oop/Animal.py\`
3. **Đa hình (Polymorphism)**: Xem ví dụ trong \`src/oop/Shape.cpp\`
4. **Trừu tượng (Abstraction)**: Xem ví dụ trong \`src/oop/Employee.cs\` (Vehicle.c giả lập struct)
5. **Cấu trúc Web**: Xem các file trong \`src/web/\`

Bạn có thể chỉnh sửa trực tiếp, thêm file mới, mở thư mục cục bộ của mình để lưu code!`
  },
  {
    path: "src/oop/BankAccount.cs",
    name: "BankAccount.cs",
    language: "csharp",
    content: `using System;

namespace OOP_Encapsulation
{
    // 1. Tính Đóng Gói (Encapsulation)
    // Che giấu dữ liệu bằng private, cho truy cập có kiểm soát qua Property
    public class BankAccount
    {
        private string accountNumber;
        private double balance;

        public BankAccount(string accNum, double initialBalance)
        {
            this.accountNumber = accNum;
            this.balance = initialBalance >= 0 ? initialBalance : 0;
        }

        public double Balance
        {
            get { return balance; }
        }

        public void Deposit(double amount)
        {
            if (amount > 0)
            {
                balance += amount;
                Console.WriteLine($"Nạp tiền: +{amount}. Số dư mới: {balance}");
            }
        }

        public void Withdraw(double amount)
        {
            if (amount > 0 && amount <= balance)
            {
                balance -= amount;
                Console.WriteLine($"Rút tiền: -{amount}. Số dư mới: {balance}");
            }
        }
    }
}`
  },
  {
    path: "src/oop/Shape.cpp",
    name: "Shape.cpp",
    language: "cpp",
    content: `// 2. Tính Đa Hình (Polymorphism) & Trừu tượng (Abstraction)
// Sử dụng hàm ảo virtual để các class con override hành vi
#include <iostream>
#include <vector>
using namespace std;

class Shape {
public:
    virtual void draw() = 0; // Pure Virtual Function
    virtual ~Shape() {}
};

class Circle : public Shape {
public:
    void draw() override {
        cout << "Vẽ hình Tròn (Circle)" << endl;
    }
};

class Rectangle : public Shape {
public:
    void draw() override {
        cout << "Vẽ hình Chữ Nhật (Rectangle)" << endl;
    }
};

int main() {
    vector<Shape*> shapes;
    shapes.push_back(new Circle());
    shapes.push_back(new Rectangle());

    for (Shape* s : shapes) {
        s->draw();
        delete s;
    }
    return 0;
}`
  },
  {
    path: "src/oop/Animal.py",
    name: "Animal.py",
    language: "python",
    content: `# 3. Tính Kế Thừa (Inheritance)
# Class con Dog & Cat kế thừa constructor và method từ Animal

class Animal:
    def __init__(self, name):
        self.name = name

    def eat(self):
        print(f"{self.name} đang ăn...")

class Dog(Animal):
    def make_sound(self):
        return "Gâu Gâu!"

class Cat(Animal):
    def make_sound(self):
        return "Meo Meo!"

if __name__ == "__main__":
    milu = Dog("Milu")
    miu = Cat("Miu")
    milu.eat()
    print(milu.make_sound())
`
  },
  {
    path: "src/oop/Vehicle.c",
    name: "Vehicle.c",
    language: "c",
    content: `// Giả lập OOP Class bằng Struct & Function Pointer trong ngôn ngữ C
#include <stdio.h>
#include <string.h>

struct Vehicle {
    char brand[50];
    int speed;
    void (*showInfo)(struct Vehicle*);
};

void displayVehicleInfo(struct Vehicle* v) {
    printf("Xe thương hiệu: %s, Vận tốc: %d km/h\\n", v->brand, v->speed);
}

int main() {
    struct Vehicle myCar;
    strcpy(myCar.brand, "VinFast");
    myCar.speed = 120;
    myCar.showInfo = displayVehicleInfo;

    myCar.showInfo(&myCar);
    return 0;
}`
  },
  {
    path: "src/database/DBConnection.php",
    name: "DBConnection.php",
    language: "php",
    content: `<?php
// Lớp quản lý Kết nối Database Cục bộ (OOP PHP)

class DBConnection {
    private $host = "localhost";
    private $dbname = "hugo_wishpax";
    private $username = "root";
    private $password = "root";
    private $conn;

    public function getConnection() {
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->dbname, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            echo "Kết nối CSDL cục bộ thành công!\\n";
        } catch(PDOException $e) {
            echo "Lỗi kết nối: " . $e->getMessage();
        }
        return $this->conn;
    }
}
?>`
  },
  {
    path: "src/web/index.html",
    name: "index.html",
    language: "html",
    content: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Dự Án Web Mini</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="card">
        <h1>Ứng dụng Học tập Lập trình</h1>
        <p>Học lập trình C, C++, C#, Python, PHP thông qua IDE Web.</p>
        <button id="btn">Bắt Đầu Học</button>
    </div>
    <script src="app.js"></script>
</body>
</html>`
  },
  {
    path: "src/web/style.css",
    name: "style.css",
    language: "css",
    content: `body {
    background: #0f172a;
    color: white;
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 105vh;
    margin: 0;
}
.card {
    background: #1e293b;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
    text-align: center;
}
button {
    background: #6366f1;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
}`
  },
  {
    path: "src/web/app.js",
    name: "app.js",
    language: "javascript",
    content: `document.getElementById('btn').addEventListener('click', () => {
    alert('Bắt đầu bài học OOP và phát triển phần mềm!');
});`
  }
];

export const TUTORIALS = [
  {
    lang: "C / C++",
    icon: "c",
    intro: "C/C++ là nền tảng của cấu trúc dữ liệu và giải thuật. Giúp hiểu sâu về quản lý bộ nhớ, con trỏ.",
    sections: [
      {
        title: "Cú pháp cơ bản C/C++",
        content: `- Mọi chương trình C/C++ đều chạy từ hàm main(): \n  int main() { ... return 0; }\n- Kết thúc câu lệnh bắt buộc có dấu chấm phẩy (;).\n- Sử dụng printf() (trong C) hoặc std::cout (trong C++) để in kết quả ra màn hình.`
      },
      {
        title: "Kiểu dữ liệu",
        content: `- int: Số nguyên (ví dụ: 10, -5)\n- float, double: Số thực (ví dụ: 3.14)\n- char: Ký tự đơn (ví dụ: 'A')\n- bool: Đúng/Sai (true/false) trong C++`
      }
    ]
  },
  {
    lang: "C#",
    icon: "csharp",
    intro: "Ngôn ngữ hướng đối tượng mạnh mẽ của Microsoft, dùng để viết WinForms, Web (.NET) và Game (Unity).",
    sections: [
      {
        title: "OOP trong C#",
        content: `- OOP viết tắt của Object Oriented Programming (Lập trình hướng đối tượng).\n- 4 tính chất chính: Đóng gói (Encapsulation), Kế thừa (Inheritance), Đa hình (Polymorphism), Trừu tượng (Abstraction).`
      }
    ]
  },
  {
    lang: "Python",
    icon: "python",
    intro: "Ngôn ngữ cấu trúc đơn giản, cực kỳ mạnh về Trí tuệ nhân tạo (AI), Phân tích dữ liệu (Data Analysis) và Script tự động.",
    sections: [
      {
        title: "Cú pháp thụt lề (Indentation)",
        content: `- Python KHÔNG dùng dấu ngoặc nhọn { } để gom nhóm code.\n- Python dùng khoảng trắng thụt lề (thường là 4 spaces) để định nghĩa block code.\n- Biến số không cần khai báo kiểu dữ liệu.`
      }
    ]
  },
  {
    lang: "HTML / CSS / JS",
    icon: "html",
    intro: "Bộ ba xương sống của lập trình Front-end Web. Giúp xây dựng giao diện ứng dụng.",
    sections: [
      {
        title: "Cấu trúc một trang Web",
        content: `- HTML: Xây dựng cấu trúc (thẻ div, p, h1, button...)\n- CSS: Định dạng màu sắc, bố cục, khoảng cách (styles...)\n- Javascript (JS): Xử lý tương tác, sự kiện (click, gửi form...)`
      }
    ]
  },
  {
    lang: "PHP & phpMyAdmin",
    icon: "php",
    intro: "PHP là ngôn ngữ kịch bản máy chủ, thường kết hợp với MySQL. Rất nhẹ và tối ưu cho các dự án Web nhỏ và vừa.",
    sections: [
      {
        title: "Kết nối Database",
        content: `- Dùng PDO hoặc MySQLi để kết nối từ PHP tới cơ sở dữ liệu MySQL.\n- Quản lý database trực quan bằng phpMyAdmin trên localhost.`
      }
    ]
  }
];
