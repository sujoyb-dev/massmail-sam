# BulkMail

## Routes

### GET /queuestatus

- should be logged in

### POST /auth/login

- email , password

### POST /auth/register

- name, email, password, role

### POST /admin/upload

- form fieldname should be `uploadcsv`
- assumption: tags are seperated by '+' under single header.
- use [test.csv](./test.csv) for reference

### GET /admin/mailreports

- query param:type
- can be bounces

## GET /vendor/queuestatus

## GET /vendor/usersbytags

- query param:tags

## GET /recruiter/queuestatus

## GET /recruiter/usersbytags

- query param:tags

## POST /mail/requirement

- args: to, from, subject, html/text

## POST /mail/vendor

- args: to, from, subject, html/text
- name property in form is attachments

## TODO

- [x] upload mei filetype
- [x] Home options based
- [ ] emails added to mlab
- [x] mails to all vendors and vice versa

## Notes for views

- In email form w attachments, use name property as `attachments`

```html
<form action="/route" method="post" enctype="multipart/form-data">
  <input type="file" name="attachments" />
</form>
```

- In upload form w csv, use name property as `uploadcsv`

```html
<form action="/route" method="post" enctype="multipart/form-data">
  <input type="file" name="uploadcsv" />
</form>
```

- For sending mails set MAIL_ENV to prod
