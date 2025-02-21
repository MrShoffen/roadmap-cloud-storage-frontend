https://gist.github.com/zhukovsd/1052313b231bb1eebd5b910990ee1050 - формат данных расписан Сергеем здесь

# Особенности реализации
## Формат
Для работы фронта необходимо привести ответ от бэкенда в корректный для фронтенда вид. Этим занимается функция mapObjectToFrontFormat в файле config.js - её можно изменить, если необходимо.

Чтобы фронт работал без доп настроек, необходимо соблюдать следующие правила
1) Корневой каталог обозначается пустой строкой - "";
2) Например. если файл test.txt находится в корне - в ответе он должен выглядеть как
```json
{
  "path": "", // путь к папке, в которой лежит ресурс
  "name": "test",
  "size": 123, // размер файла в байтах. Если ресурс - папка, это поле отсутствует
  "type": "FILE" // DIRECTORY или FILE
}
```

Если речь идет о папке test в корне - то в конце имени нужно добавлять слэш и помечать как DIRECTORY type
```json
{
  "path": "", // путь к папке, в которой лежит ресурс
  "name": "test/",
  "size": 0, // размер файла в байтах. Если ресурс - папка, это поле отсутствует
  "type": "DIRECTORY" // DIRECTORY или FILE
}
```
3) Так же слэш в конце должен присутствовать в path, если это не корневая папка

```json
{
  "path": "folder1/folder2/", // путь к папке, в которой лежит ресурс
  "name": "test/",
  "size": 0, // размер файла в байтах. Если ресурс - папка, это поле отсутствует
  "type": "DIRECTORY" // DIRECTORY или FILE
}
```
4) Все строки в ответах - в обычной форме, не URL encoded
5) Если формат ответа отличается - можно изменить функцию в конфиге, чтобы ответ корректно приводился к фронт формату. Подробнее о формате - в конце документа

## Скачивание файлов
### Progress bar
Для отображения прогресса скачивания необходимо знать размер скачиваемого ресурса.
В случае с файлами - это просто, фронт уже знает о размере, поэтому может подсчитать.

Но при скачивании папки  - фронт не может знать размер сжатого зип архива.

Чтобы прогресс отображался - фронт делает запрос к информации о папке и в качестве
целевого размера для подсчета использует его (разница с архивом где-то в районе 10 процентов, что не так критично для прогресс бара)

GET /resource?path=$path

В формате, предложенном Сергеем, для папки размер указывается (т.е. 0). Но если Вы хотите, чтобы прогресс отображался - в случае с папкой добавьте в ответ её размер (подсчитать рекурсивно все файлы с префиксом).

В своем варианте я так и делал. Размер папок возвращается только по этому эндпоинту

GET /resource?path=$path

В эндпоинте, который возращает содержимое конкретной папки (GET /directory?path=$path) , размер вложенных папок не нужен. Лишняя нагрузка.

### Задержка архивирования
При скачивании больших папок с большой вложенностью бэк будет тратить некоторое время на их формирование.

Поэтому после нажатия кнопки скачать и началом скачивания может образоваться достаточно большая пауза.

В качестве решения можно формировать архив на лету и сразу же его отправлять. Т.е. пользователь начинает скачивать без задержки, и архив в этот момент формируется параллельно .

## Загрузка файлов
При загрузке за один раз нескольких файлов - фронт разбивает всё содержимое (в том числе и во вложенных папках)
на отдельные файлы. Каждое имя файла - относительный путь.

Пример - мы загружаем 2 файла test1 и test2 - в Multipart на бэке в getOriginalFilename мы получим test1  и test2

Мы загружаем папку folder , в которой находится 1 файл test - на бэке мы получим 1 файл с именем folder/test

и т.д.

В консоли браузера при начале загрузки можно увидеть весь список файлов после парсинга имён.


# Запуск фронтенда

### 1 Вариант - раздача статики
Данный способ удобно использовать в процессе разработки, чтобы постепенно тестировать api.
В этом варианте не будет страницы 404 при некорректном пути в адресной страке, т.к. для этого пришлось бы в security разрешать все эндпоинты.
Фиксится 2 вариантом при раздаче через docker/nginx

1) Добавьте содержимое архива front.zip в директорию resources/static/

в итогде в папке static должна оказаться папка assets и 2 файла - index.html и config.js

2) Чтобы статика не блокировалась security - нужно добавить в чейн следующий матчер

```java
.requestMatchers(
    "/",
    "/index.html",
    "/config.js",
    "/assets/**",
    "/login",
    "/help",
    "/registration",
    "/files/**"
).permitAll()
```

Все ваши защищенные и публичные эндпоинты лучше расположить с префиксом - например /api/ - этот префикс нужно 
установить и на фронте, чтобы он знал, куда ему обращаться. Это делается в файле config.js 

```java
.requestMatchers(HttpMethod.POST, "/api/auth/sign-in").permitAll()
.requestMatchers(HttpMethod.POST, "/api/auth/sign-up").permitAll()
.requestMatchers("/api/**").authenticated()
```

3) Чтобы react корректно отрабатывал при перезагрузке страницы (загружал ту же страницу и папку), нужно создать контроллер, который перенаправляет запросы на index.html - ниже полный код
```java
@Controller
public class FrontendController {

    @GetMapping(value = {"/registration", "/login", "/help", "/files/**"})
    public String handleRefresh() {
        return "forward:/index.html";
    }

}
```
4) Можете заглянуть в файл config.js - можно добавить ссылку на свой гитхаб репозиторий, кастомизацию к валидации форм или корневому адресу api 
5Всё готово - можно запускать проект. Фронт будет доступен по адресу бэка - дефолтный: localhost:8080/ 

### 2 Вариант - Docker
Этот способ удобен для финального деплоя. Можно убрать из проекта всё, что написано в 1 варианте.
При корректном деплое на сайте появится страница с ошибкой 404, если в адресной строке будет некорректный путь.

0) Клонируйте полностью репозиторий.

1) В файле config.js (который в public директории, а не в архиве) - измените baseUrl на полный адрес бэкенда в докер сети . Например, http://backend:8080

2) Соберите докер образ
```
docker build -t cloud-frontend:1 .
```
После этого можете попробовать запустить образ отдельно - фронт должен стать достпен на 80 порту.


3) Разместите сервис с фронтом в docker compose  - он будет работать через nginx  проксировать запросы с 80 порта на ваш бэкенд внутри докер сети
4) Не забудьте про CORS на стороне спринга, т.к. запросы будут идти для него с другого хоста.
5) docker compose up - проверяем по адресу http://localhost


### Конфиг
Чтобы валидация на фронте совпадала с вашей на бэкенде - основные моменты вынесены в конфиг. (валидация имени пользователя, пароля и имени папки)

В конфиге можно настроить минимальную и максимальную длину строки. И указать регулярное выражение, которому строка должна соответствовать.

Для тестирования можно отключить валидацию, чтобы вы могли отправлять некорректные данные в  формах

### Формат данных для фронтенда
Фронт построен и работает на объектах с определенными полями с определенными правилами.
```jsx

{
    lastModified: данное поле в реализации Сергея не используется, 
    name:   //Имя файла или папки. Для папки обязательно имя должно оканчиваться слэшем
    
    size:   //Размер в байтах
    
    path:   //путь к папке/файлу в полном формате относительно корневой директории!!! 
            // необходим для корректной навигации. Как и с 'name' - если путь к папке - в конце должен быть слэш
    
    folder:  // фронт использует простой boolean. true - папка, false - файл
}
```

Для маппинга сущностей бэкенда к этой форме используется данная функция из config.js

```js
        mapObjectToFrontFormat: (obj) => {
            return {
                lastModified: null, 
                name: obj.name,
                size: obj.size,
                path: obj.path + obj.name, 
                folder: obj.type === "DIRECTORY" 
            }
        }
```
Как видно, она просто складывает имя и путь и присваевает folder логическое значение. Если ваш формат отличается, то можете добавить 
в функцию доп. логику, чтобы привести к стандартному виду.

Например, если вы решили, что у вас корневая директория обозначается как одинарый слэш - 
```js
            const root = obj.path === "/" ? "" : obj.path;

            return {
                lastModified: null,
                name: obj.name,
                size: obj.size,
                path: root + obj.name, 
                folder: obj.type === "DIRECTORY" 
            }
```

Или если у вас имена папок не оканчиваются на слэш:
```js
            const frontName = obj.type === "DIRECTORY" ? (obj.name + '/') : obj.name;

            return {
                lastModified: null,
                name: obj.name,
                size: obj.size,
                path: obj.path + frontName, 
                folder: obj.type === "DIRECTORY" 
            }
```

Ну и можно смаппить lastModified, если вы его добавите в ответе на бэке. Фронт проверяет это значение, и если оно не null - оно будет отображаться в информации о файле
и в режиме просмотра "Список"

Если будут сложности с маппингом - пишите мне в тг, постараюсь помочь @MrShoffen