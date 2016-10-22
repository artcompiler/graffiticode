heroku pg:psql -c "select ast from pieces where label = 'show' and ast is not null and src like '%NYS.G7%' and obj like '{_score_:1%' and src not like '%calculate%';"
