## rs.post( collection, key, record [, options])

Post a record into a collection.

SQL equivavalent of inserting a row into a table.


Return a promise of a result structure:
    count: Number of records affected
    key:   array of keys


result = await rs.post( collection, key, record [, options])

Keys:

- Collection and Key must conform to valid file names. Invalid charakters are removed from the key.
- Keys should never be made of user input data.
- If the key already exists, the old record is overwritten.
- If key is omittedt (null) a auto sequence number is used as key.
- if the option is used, an auto incremented sequence at the begining of the key.
- The penalty of using an auto increment sequence, is about 3 times than of a  post without it.
- Avoid keys starting with "." they might not apear in a wildcard search.
- Avoid the charakters *?<>| as they might create confusion. (The are legal)

options:
options is an integer composed og flags binarily ored together:

    _ADD_AUTO_INC: this will add an auto incremented sequence at the begining of the key
