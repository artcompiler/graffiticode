heroku pg:psql -c "select id from pieces where language='L106' and label = 'show' and src not like '%speak%' and src not like '%calculate%' and src not like '%hideExpected%' order by id;" > l106ids.out