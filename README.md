# Caspian_Contractors
Test task for Caspian_Contractors

# How to run it
- Pull from this repo
- Install docker
- run "docker-compose up"
- U may use Postman or other clients for testing end points

# End points:
for filling data intto DB: 
GET http://localhost:3001/usdtTransfers/sync?fromBlock=17612968&toBlock=17612970 
for fetching data from API with pagination:
POST http://localhost:3001/usdtTransfers?page=1&perPage=25

