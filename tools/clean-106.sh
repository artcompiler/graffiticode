heroku pg:psql -c "update pieces set label='hide' where language='L106' and label='show' and obj not like '{_score_:1%';"
