heroku pg:psql -c "select ast from pieces where label='show' and src like '%equivLiteral%' and src like '%speak%' and obj like '{_score_:1%' and language='L106';"
