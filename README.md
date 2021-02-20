# certification

# To run media-apps with docker

docker pull sancdocker/eedureka_media_admin_app_image  
docker pull sancdocker/edureka_media_customer_app_image 

docker run -dp 8801:8801 sancdocker/eedureka_media_admin_app_image:latest
docker run -dp 8800:8800 sancdocker/edureka_media_customer_app_image:latest

to access site:
admin app: http://localhost:8801/
customer app: http://localhost:8800/

# to stop    
docker-compose down    

github: https://github.com/SanC/certification
