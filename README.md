# NodeJS Case

Aplikasi CRUD produk sederhana (Node.js + Express + MySQL). Halaman menampilkan IP server
EC2 yang sedang melayani, untuk membuktikan Load Balancer bekerja.

## Jalankan di Laptop

```bash
npm install
cp .env.example .env
npm start
```

Buka http://localhost:3000

## Deploy di EC2

### 1. Buat RDS MySQL

- Engine MySQL, username `admin`, isi password
- Public access: No
- Security Group RDS: izinkan port **3306** dari Security Group EC2
- Salin **Endpoint** RDS

### 2. Buat EC2

- AMI: Amazon Linux 2023, Instance type: t3a.micro
- Security Group: izinkan **22 (SSH)** dan **80 (HTTP)**

### 3. Masuk ke EC2 dan Install

```bash
ssh -i key.pem ec2-user@<ip-public-ec2>
```

```bash
sudo dnf update -y
sudo dnf install -y nodejs git nginx mariadb105
sudo npm install -g pm2
```

### 4. Clone Project

```bash
git clone https://github.com/Adelya-F/nodejscase.git
cd nodejscase
npm install
```

### 5. Import Database ke RDS

```bash
mysql -h <endpoint-rds> -u admin -p < database.sql
```

Cek hasilnya:

```bash
mysql -h <endpoint-rds> -u admin -p -e "SELECT * FROM nodejscase_db.products"
```

### 6. Konfigurasi .env

```bash
cp .env.example .env
nano .env
```

```
PORT=3000
DB_HOST=<endpoint-rds>
DB_USER=admin
DB_PASSWORD=<password-rds>
DB_NAME=nodejscase_db
```

### 7. Jalankan dengan PM2

```bash
pm2 start index.js --name nodejscase
pm2 save
pm2 startup
```

Jalankan perintah yang muncul dari `pm2 startup` supaya aplikasi otomatis jalan saat EC2 reboot.

### 8. Konfigurasi Nginx

```bash
sudo nano /etc/nginx/conf.d/nodejscase.conf
```

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo nginx -t
sudo systemctl enable --now nginx
```

Buka `http://<ip-public-ec2>` di browser.

### 9. Load Balancer + Auto Scaling

1. Buat **AMI** dari EC2 yang sudah jadi
2. Buat **Launch Template** pakai AMI tersebut
3. Buat **Target Group** (HTTP port 80)
4. Buat **Application Load Balancer** di public subnet, arahkan ke Target Group
5. Buat **Auto Scaling Group** dari Launch Template di private subnet (2 AZ), sambungkan ke Target Group

Buka DNS Load Balancer lalu refresh beberapa kali, **Server IP** akan berganti-ganti.
