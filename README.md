# botcas
Веб казино для вашего дискорд бота с MongoDB
#### ⚠️ Заменить favicon сайта необходимо самому, а аватар в `/public/logo.png` \[Мне лень]
#### ⚠️ Недоделано и выложено сырым

Дизайн был сплагиачен с другого сайта (не скажу)
- Авторизация через Discord OAuth2
- Привязка к вашей MongoDB 
- Удобный адаптивный интерфейс

##### Сделано:
- Double
- NVuti
- Jackpot
##### TODO:
- Мины
- Dice
- И другие режимы


## Установка
- Распаковать архив в папку
- Выполнить `npm i`
- Настроить конфиг

## Запуск
- `node index.js`

## Конфиг
| Параметр           | Значение                                                    |
| ------------------ | ----------------------------------------------------------- |
| application_id     | Client ID вашего Discord приложения во вкладке OAuth2       |
| application_secret | Client Secret вашего Discord приложения во вкладке OAuth2   |
| bot_token          | Token вашего Discord приложения во вкладке Bot              |
| mongodb            | Ваша URL для подключения к MongoDB                          |
| web_port           | Порт на котором будет запущен веб (сайт)                    |
| ws_port            | Порт для общения сайта с сервером (WebSocket)               |
| databaseName       | Название бд в которой хранится коллекция с пользователями   |
| collectionName     | Название коллекции в которой хранится баланс пользователей  |
| idField            | Ключ (филд, столбец) в котором хранится ID пользователя     |
| moneyField         | Ключ (филд, столбец) в котором хранится баланс пользователя |
| cookieKey          | Ключ шифрования Cookie файлов, (может быть любым)           |
| host               | Адрес сайта включая порт                                    |
| wsHost             | Адрес WebSocket включая порт                                |
| maxCookieAge       | Максимальный срок жизни файлов Cookie                       |

![](https://i.imgur.com/0uuwnU9.png)
![](https://i.imgur.com/eLwKgIS.png)
![](https://i.imgur.com/yg4ZJF9.png)
