## rs.post( collection, key, record [, options])

Post a record into a collection.

SQL equivavalent of inserting a row into a table.


Return a promise of a result structure:
    count: Number of records affected
    key:   array of keys


result = await rs.post( collection, key, record [, options])

Keys:

- Collection and Key must conform to valid file names. Invalid charakters are removed from the key.
- If the key already exists, the old record is overwritten.
- If key is omittedt (null) a auto sequence number is used as key.
- if the option is used, an auto incremented sequence at the begining of the key.
- Using an auto increment sequence, takes about 3 times longer, than an post without it.

options:
options is an integer composed og flags binaryly ored together:

    _ADD_AUTO_INC: this will add an auto incremented sequence at the begining of the key
