/* Deep Schema — study content
   One zone per ITSC 3160 lecture. Each zone has:
     creature  – the "bad database practice" boss: name, hp, practice, lore, counter, qs (questions)
     mc        – multiple-choice scan questions: { q, a (correct), w: [3 wrong], why }
     special   – one puzzle: type "sort" (items into bins) or "stack" (SQL lines in order)
   Visual fields (pal colors, flora type, creature id) are used by the renderer in src/game.js.
   TUT_PLAN is the scripted training dive used by the tutorial. */
window.DS_CONTENT = (() => {
const ZONES = [
{ name: "Kelp Shallows", depth: [8, 40], topic: "Intro to Databases", hull: 1, flora: "kelp",
  pal: { top: "#1d8fa6", bot: "#0b4a63", fog: "#0e5b73", floor: "#35614f" },
  creature: { id: "leech", name: "Redundancy Leech", hp: 3,
    practice: "Storing the same data in many separate files",
    lore: "Attaches to file-based systems and copies itself into every department's files. When one copy is updated and the others aren't, the data no longer agrees with itself.",
    counter: "A DBMS stores each fact once and manages the data as a single unit.",
    qs: [
      { q: "The Leech copied a customer's address into three department files, and only one copy was updated. What problem does that cause?", a: "Data inconsistency: conflicting copies of the same data", w: ["Data isolation", "A concurrency lock", "A security breach"], why: "Redundancy leads to inconsistency when the copies drift apart." },
      { q: "What drives the Leech off by storing each fact once?", a: "The database approach, managed by a DBMS", w: ["More file folders", "A separate spreadsheet per department", "Nightly printed backups"], why: "The database approach was developed to fix file-system redundancy." },
      { q: "Besides conflicting copies, what else does redundancy cost?", a: "Wasted storage and duplicated effort", w: ["Faster queries", "Better security", "Fewer files to manage"], why: "Every extra copy takes space and work to maintain." }
    ] },
  mc: [
    { q: "Which of the following best describes a data element?", a: "A single fact or piece of information", w: ["A collection of unrelated facts", "A type of database software", "A tool for analyzing statistics"], why: "A data element is one fact, like a single name or a single price." },
    { q: "What turns data into information?", a: "Processing it so it increases the knowledge of the person using it", w: ["Storing it in a file", "Encrypting it", "Collecting more of it"], why: "Information is data in context or summarized." },
    { q: "Why is enforcing security difficult in a file-based system?", a: "Constraints are added in an ad-hoc manner", w: ["Files are always encrypted", "Access privileges are clearly defined", "Users cannot access files"], why: "Ad-hoc programs per department leave no central place to enforce privileges." },
    { q: "What is the main purpose of a DBMS?", a: "To store and retrieve data efficiently", w: ["To design websites", "To manage operating systems", "To create spreadsheets"], why: "A DBMS controls all access: create, read, update and delete, with integrity and security." },
    { q: "What is a key reason the database approach was developed?", a: "To address difficulties in file-based systems", w: ["To reduce hardware costs", "To eliminate spreadsheets", "To replace all manual record keeping"], why: "Redundancy, isolation, integrity, security and concurrency problems drove it." },
    { q: "What best defines a database?", a: "A shared collection of related data used to support organizational activities", w: ["A set of programs used to manage files", "Unrelated facts stored randomly", "A personal budgeting spreadsheet"], why: "Organized, related, built for a purpose and managed as a single unit." },
    { q: "Which is NOT a property of a database?", a: "It stores data randomly without structure", w: ["It represents real-world information", "It is designed for a specific purpose", "It is logical and internally consistent"], why: "Databases are structured and coherent." },
    { q: "In a database, a table is composed of…", a: "A combination of fields", w: ["A single data element", "A group of folders", "A set of user passwords"], why: "Fields are columns, and each row holds one record." },
    { q: "Data isolation means…", a: "Data is scattered across application files, so new programs struggle to get it", w: ["Data is encrypted", "Each user has a private copy", "Data is backed up offsite"], why: "Isolated data makes it hard for new applications to retrieve what they need." }
  ],
  special: { type: "sort", title: "Sort the salvage", prompt: "Is each item a file-based problem or a database advantage?",
    bins: ["File-based problem", "Database advantage"],
    items: [
      { t: "Same data in multiple places", b: 0, why: "That's redundancy." }, { t: "Data scattered across app files", b: 0, why: "That's isolation." },
      { t: "Constraints coded into each program", b: 0, why: "Integrity rules live in each program's code." }, { t: "Whole files locked per user", b: 0, why: "This blocks concurrent access." },
      { t: "Improved data security", b: 1, why: "A DBMS enforces privileges centrally." }, { t: "Controlled redundancy", b: 1, why: "Each fact is stored once." },
      { t: "Improved concurrency control", b: 1, why: "Many users can work at once." }, { t: "Improved data standards", b: 1, why: "Central management enforces standards." } ] } },

{ name: "Coral Plateau", depth: [40, 120], topic: "Relational Databases", hull: 1, flora: "coral",
  pal: { top: "#136f99", bot: "#082f4d", fog: "#0b3f62", floor: "#5b4a5e" },
  creature: { id: "wraith", name: "Null Wraith", hp: 3,
    practice: "Misusing NULL: comparing with = NULL or allowing NULL keys",
    lore: "A translucent drifter with an empty core. It makes queries quietly return nothing and tries to slip unknown values into primary keys.",
    counter: "Use IS NULL, keep primary keys NOT NULL, and remember that comparisons with NULL return NULL.",
    qs: [
      { q: "The Wraith suggests WHERE phone = NULL. What does that comparison return?", a: "NULL, so no rows match", w: ["TRUE for every missing phone", "FALSE", "An error"], why: "Any comparison with NULL is NULL (unknown)." },
      { q: "Which test correctly finds rows with a missing value?", a: "IS NULL", w: ["= NULL", "LIKE NULL", "== NULL"], why: "IS NULL is the only correct NULL test." },
      { q: "The Wraith tries to store NULL in a primary key column. Why is that forbidden?", a: "A NULL key can't identify any row", w: ["NULL takes too much space", "Primary keys must be numbers", "It's allowed if the key is unique"], why: "Primary keys must be unique and not NULL." },
      { q: "NULL represents…", a: "A missing value that is unknown or doesn't apply", w: ["Zero", "An empty string", "FALSE"], why: "NULL isn't a value. It marks one that's missing." }
    ] },
  mc: [
    { q: "A tuple is…", a: "One row (record) in a table", w: ["One column", "A named set of tables", "A data type"], why: "A tuple is one instance of the entity." },
    { q: "The degree of a relation is…", a: "The number of attributes (columns)", w: ["The number of rows", "The number of keys", "The number of related tables"], why: "Degree counts columns. Cardinality of a relation counts rows." },
    { q: "A domain is…", a: "A named set of possible values for an attribute", w: ["The website a database runs on", "A group of tables", "The primary key"], why: "Example: {Full-Time, Part-Time, Contract}." },
    { q: "Which statement about foreign keys is true?", a: "They may repeat and may be NULL, but non-NULL values must match a primary key", w: ["They must be unique and not NULL", "They must have the same name as the PK", "They can hold any value"], why: "Foreign keys follow looser rules than primary keys." },
    { q: "What is TRUE AND NULL?", a: "NULL", w: ["TRUE", "FALSE", "An error"], why: "The outcome is uncertain." },
    { q: "How do SUM, AVG, MIN and MAX treat NULL?", a: "They ignore it", w: ["They count it as zero", "They return NULL", "They raise an error"], why: "Aggregates skip NULLs." },
    { q: "Which referential action is applied when none is specified?", a: "RESTRICT", w: ["CASCADE", "SET NULL", "SET DEFAULT"], why: "RESTRICT rejects violating changes by default." },
    { q: "When can't SET NULL be used?", a: "When the foreign key column is NOT NULL", w: ["With composite keys", "With numeric keys", "When CASCADE is also set"], why: "A NOT NULL column can't be set to NULL." },
    { q: "Which change can NOT violate referential integrity?", a: "Deleting a row that contains a foreign key", w: ["Updating a primary key", "Inserting a row with a foreign key", "Deleting a row that holds a primary key"], why: "Removing a child row never leaves a dangling reference." }
  ],
  special: { type: "sort", title: "Calibrate the tools", prompt: "Match each relational operation to what it does.",
    bins: ["Select", "Project", "Join", "Union", "Intersect", "Difference"],
    items: [
      { t: "Keeps a subset of rows", b: 0, why: "Select filters rows." }, { t: "Removes columns", b: 1, why: "Project keeps only some columns." },
      { t: "Product, then select", b: 2, why: "That's a join." }, { t: "All rows of both tables", b: 3, why: "That's a union." },
      { t: "Rows common to both", b: 4, why: "That's an intersect." }, { t: "Rows in one but not the other", b: 5, why: "That's a difference." } ] } },

{ name: "Grassy Dunes", depth: [120, 250], topic: "SQL Part 1: DDL & DML", hull: 2, flora: "grass",
  pal: { top: "#0f5a85", bot: "#06263f", fog: "#08324f", floor: "#6b6448" },
  creature: { id: "shark", name: "Whereless Shark", hp: 3,
    practice: "Running UPDATE or DELETE without a WHERE clause",
    lore: "A blunt hunter that bites the whole school at once. One statement without a WHERE and every row in the table is rewritten or gone.",
    counter: "Always scope changes with WHERE, and let constraints like FOREIGN KEY block bad writes.",
    qs: [
      { q: "UPDATE Employee SET Salary = 42000; What did the Shark just do?", a: "Gave every employee a 42,000 salary", w: ["Updated only the first row", "Raised an error", "Nothing, because the WHERE is missing"], why: "UPDATE without WHERE changes all rows." },
      { q: "Which clause keeps a DELETE from emptying the whole table?", a: "WHERE", w: ["ORDER BY", "HAVING", "GROUP BY"], why: "WHERE selects which rows to delete." },
      { q: "Which constraint stops the Shark from inserting a song for an album that doesn't exist?", a: "FOREIGN KEY", w: ["UNIQUE", "CHECK", "DEFAULT"], why: "An FK rejects values with no matching primary key." }
    ] },
  mc: [
    { q: "Which keyword makes MySQL generate the next ID?", a: "AUTO_INCREMENT", w: ["DEFAULT", "IDENTITY_KEY", "SERIAL_NEXT"], why: "AUTO_INCREMENT is MySQL's auto-numbering keyword." },
    { q: "A UNIQUE constraint across multiple columns is called…", a: "A table-level constraint", w: ["A column-level constraint", "A composite index", "A CHECK constraint"], why: "Multiple columns makes it table-level." },
    { q: "What does a CHECK constraint do?", a: "Limits a column's values with an expression", w: ["Checks that a row exists", "Makes a column unique", "Validates foreign keys"], why: "Example: CHECK (Age BETWEEN 18 AND 65)." },
    { q: "In MySQL, schema is a synonym for…", a: "Database", w: ["Table", "Column", "View"], why: "Oracle and DB2 make a distinction, but MySQL doesn't." },
    { q: "A signed number…", a: "May be negative", w: ["Cannot be negative", "Has a decimal point", "Is stored as text"], why: "Unsigned numbers can't be negative." },
    { q: "What does USE sakila; do?", a: "Selects sakila as the database for the statements that follow", w: ["Creates sakila", "Deletes sakila", "Lists sakila's tables"], why: "USE chooses the working database." },
    { q: "Why can't you drop a table another table's FK references?", a: "Its rows would be left pointing at nothing", w: ["Tables can never be dropped", "It requires AUTO_INCREMENT", "Only views can be dropped"], why: "The FK protects referential integrity." },
    { q: "Without a constraint, a column's value is NULL when…", a: "A row is inserted without a value for it", w: ["The table is created", "The column is indexed", "The row is updated"], why: "NOT NULL and DEFAULT change that behavior." }
  ],
  special: { type: "sort", title: "Sort the toolbox", prompt: "Does each statement build structure (DDL) or work with rows (DML)?",
    bins: ["DDL: structure", "DML: data"],
    items: [
      { t: "CREATE TABLE", b: 0, why: "It defines a table." }, { t: "ALTER TABLE", b: 0, why: "It changes structure." },
      { t: "DROP DATABASE", b: 0, why: "It removes structure." }, { t: "CREATE DATABASE", b: 0, why: "It defines a database." },
      { t: "INSERT INTO", b: 1, why: "It adds rows." }, { t: "UPDATE", b: 1, why: "It changes rows." }, { t: "DELETE FROM", b: 1, why: "It removes rows." } ] } },

{ name: "Crystal Caves", depth: [250, 450], topic: "SQL Part 2: SELECT & Joins", hull: 2, flora: "crystal",
  pal: { top: "#0d3f6e", bot: "#050f2a", fog: "#0a1f45", floor: "#2b2350" },
  creature: { id: "kraken", name: "Cartesian Kraken", hp: 3,
    practice: "Joining tables without a join condition",
    lore: "Every tentacle grabs every row of the other table. Leave out the ON clause and a few thousand rows grow into millions.",
    counter: "Join foreign key to primary key with an ON condition. Use LEFT JOIN when unmatched rows must stay.",
    qs: [
      { q: "Customers has 100 rows and Orders has 1,000. The Kraken joins them with no condition. How many rows come back?", a: "100,000", w: ["1,100", "1,000", "100"], why: "With no condition, every row pairs with every row: 100 × 1,000." },
      { q: "What keeps a join from becoming a Cartesian product?", a: "A join condition matching the FK to the PK", w: ["DISTINCT", "ORDER BY", "LIMIT"], why: "ON Orders.CustomerID = Customers.ID." },
      { q: "Which join keeps every customer, even those with no orders?", a: "Customers LEFT JOIN Orders", w: ["INNER JOIN", "CROSS JOIN", "A join with no ON"], why: "Unmatched customers get NULLs for the order columns." }
    ] },
  mc: [
    { q: "Which clause filters groups after GROUP BY?", a: "HAVING", w: ["WHERE", "ORDER BY", "LIMIT"], why: "WHERE filters rows before grouping." },
    { q: "COUNT(DISTINCT expr) counts…", a: "Only unique non-NULL values", w: ["All rows with duplicates", "NULL values only", "The sum of distinct values"], why: "DISTINCT removes duplicates and COUNT skips NULLs." },
    { q: "What does SUM() return when no rows match?", a: "NULL", w: ["0", "An error", "The maximum value"], why: "There is nothing to add." },
    { q: "COALESCE(a, b, c) returns…", a: "The first non-NULL value", w: ["The last non-NULL value", "The number of NULLs", "The average"], why: "It's useful for filling in defaults." },
    { q: "Which value matches LIKE 'L_t'?", a: "Lot", w: ["Lt", "Loot", "Lift"], why: "_ matches exactly one character." },
    { q: "STRCMP() returns what for equal strings?", a: "0", w: ["1", "-1", "TRUE"], why: "-1 means smaller and 1 means larger." },
    { q: "MIN() on a string column returns…", a: "The lowest alphabetical value", w: ["The shortest string", "The longest string", "NULL"], why: "Strings compare alphabetically." },
    { q: "What does the WITH clause define?", a: "Common table expressions", w: ["User permissions", "Sort order", "Temporary deletions"], why: "WITH names a result set you can use in the main query." },
    { q: "Why does a self-join need aliases?", a: "To tell the two copies of the table apart", w: ["It doesn't need them", "To rename the table permanently", "To speed it up"], why: "Example: e1 and e2." }
  ],
  special: { type: "stack", title: "Assemble the query", prompt: "Lift the clauses into order. Goal: customers with more than 30 returned rentals, busiest first.",
    blocks: ["SELECT customer_id, COUNT(*) AS rentals", "FROM rental", "WHERE return_date IS NOT NULL", "GROUP BY customer_id", "HAVING COUNT(*) > 30", "ORDER BY rentals DESC", "LIMIT 10;"],
    why: "Clause order: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT." } },

{ name: "Glowshroom Forest", depth: [450, 700], topic: "SQL Part 3: Subqueries & Views", hull: 3, flora: "shroom",
  pal: { top: "#0a2d55", bot: "#030a1f", fog: "#071a3a", floor: "#1c2a3c" },
  creature: { id: "angler", name: "Ambiguity Angler", hp: 3,
    practice: "Ambiguous column names and unaliased subqueries",
    lore: "It dangles a column named ID that exists in two tables. Bite, and the query fails, or worse, compares the wrong columns.",
    counter: "Qualify columns with table aliases, and always alias a subquery used as a table.",
    qs: [
      { q: "Both tables have an ID column, and the Angler writes SELECT ID FROM A JOIN B ON … What happens?", a: "An ambiguous-column error", w: ["It picks A's ID", "It picks B's ID", "It returns both columns"], why: "Qualify it as A.ID or B.ID." },
      { q: "A subquery used as a table in FROM needs…", a: "An alias", w: ["A WHERE clause", "A LIMIT", "DISTINCT"], why: "Derived tables must be named." },
      { q: "In a correlated subquery that reuses the outer table, what keeps the columns straight?", a: "Table aliases", w: ["ORDER BY", "GROUP BY", "Renaming the table permanently"], why: "An alias is a temporary name for the table." }
    ] },
  mc: [
    { q: "How is an uncorrelated subquery run?", a: "Inner query first, substitute its result, then the outer query", w: ["Outer once per inner row", "Both at the same time", "Inner once per outer row"], why: "It doesn't depend on the outer query." },
    { q: "A subquery is correlated when…", a: "Its WHERE references a column from the outer query", w: ["It uses GROUP BY", "It returns many rows", "It sits in FROM"], why: "It's re-run for each outer row." },
    { q: "EXISTS returns TRUE when…", a: "The subquery returns at least one row", w: ["It returns exactly one row", "It returns NULL", "It returns no rows"], why: "NOT EXISTS is the reverse." },
    { q: "A view is…", a: "A table name associated with a SELECT statement", w: ["A physical copy of a table", "An index", "A backup"], why: "It restructures data without changing the base tables." },
    { q: "If a view's columns aren't named, they're named…", a: "The same as the view query's columns", w: ["col1, col2…", "After the primary key", "Nothing, so it fails"], why: "The view inherits the names." },
    { q: "Best way to write a complex query?", a: "Break it into simple queries and build up one part at a time", w: ["Write it all at once", "Avoid joins", "Use only subqueries"], why: "Identify tables, join on keys, then add pieces." },
    { q: "Correlated subqueries commonly use…", a: "EXISTS", w: ["UNION", "LIKE", "BETWEEN"], why: "EXISTS checks whether a related row exists." }
  ],
  special: { type: "stack", title: "Assemble the subquery", prompt: "Lift the pieces into order. Goal: films longer than the average film length.",
    blocks: ["SELECT title, length", "FROM film", "WHERE length > (", "    SELECT AVG(length)", "    FROM film", ")", "ORDER BY length DESC;"],
    why: "The inner query sits in parentheses inside the outer WHERE." } },

{ name: "Wreck Field", depth: [700, 1000], topic: "Data Modeling (ER)", hull: 3, flora: "wreck",
  pal: { top: "#082447", bot: "#020816", fog: "#061433", floor: "#1e2630" },
  creature: { id: "squid", name: "Spaghetti Squid", hp: 3,
    practice: "Tangled models: unresolved M:N links, stuffed attributes, missing identifiers",
    lore: "Its tentacles tie every entity to every other with no structure in between. Nobody can tell what anything means or which row is which.",
    counter: "Resolve M:N with an associative entity, split multivalued attributes, and give every entity an identifier.",
    qs: [
      { q: "The Squid links Student and Course many-to-many with nothing in between. What fixes it?", a: "An associative entity such as Enrollment", w: ["A weak entity", "A derived attribute", "A supertype"], why: "An associative entity resolves M:N." },
      { q: "It stores phones as 'a, b, c' in one field. What kind of attribute is that really?", a: "A multivalued attribute", w: ["Composite", "Derived", "Key"], why: "It becomes its own table." },
      { q: "Every entity needs an identifier so that…", a: "Each instance can be uniquely identified", w: ["Tables sort faster", "Attributes can be NULL", "Relationships aren't needed"], why: "The identifier becomes the primary key." }
    ] },
  mc: [
    { q: "Data abstraction layers, from highest to lowest:", a: "External → Conceptual → Internal → Physical", w: ["Physical → Internal → Conceptual → External", "Conceptual → External → Internal → Physical", "Internal → Conceptual → External → Physical"], why: "Users see the external level." },
    { q: "Physical data independence means…", a: "Changing indexing or storage without changing application logic", w: ["Changing views without the conceptual schema", "Changing the ERD without the DBMS", "Changing logical schemas without physical ones"], why: "The levels above aren't affected." },
    { q: "Information about an attribute's ______ isn't shown on the ERD.", a: "domain", w: ["name", "identifier", "relationship"], why: "It belongs in the data dictionary." },
    { q: "Kernels are also known as ______ entities.", a: "independent", w: ["weak", "associative", "derived"], why: "They don't depend on another entity." },
    { q: "Existence dependency implies…", a: "A mandatory foreign key to another entity", w: ["The entity can exist alone", "The entity is always independent", "The entity has no attributes"], why: "A dependent entity needs its owner." },
    { q: "Crow's foot circle plus three prongs means…", a: "Zero or many", w: ["One and only one", "One or many", "Zero or one"], why: "The circle is the min (0) and the prongs are the max (many)." },
    { q: "The outer marking on a relationship line shows…", a: "Maximum cardinality", w: ["Minimum cardinality", "The primary key", "Participation"], why: "The inner marking shows the minimum." },
    { q: "In requirements, entities usually appear as…", a: "Nouns", w: ["Verbs", "Adjectives", "Numbers"], why: "Relationships usually appear as verbs." },
    { q: "A derived attribute like Age is drawn as…", a: "A dashed ellipse", w: ["A double ellipse", "A double rectangle", "An underlined ellipse"], why: "A double ellipse means multivalued." },
    { q: "Which design phase adds indexes?", a: "Physical design", w: ["Analysis", "Logical design", "Requirements"], why: "Analysis builds the ER model and logical design makes tables." }
  ],
  special: { type: "sort", title: "Read the wreck logs", prompt: "Widgets and Digits has projects made of tasks, and employees work on tasks. Sort each phrase.",
    bins: ["Entity", "Attribute", "Relationship"],
    items: [
      { t: "Project", b: 0, why: "A thing the company tracks." }, { t: "Task", b: 0, why: "A thing with its own data." }, { t: "Employee", b: 0, why: "A person the company tracks." },
      { t: "Duration of a project", b: 1, why: "A property of a project." }, { t: "Starting date of a task", b: 1, why: "A property of a task." }, { t: "Employee salary", b: 1, why: "A property of an employee." },
      { t: "Task belongs to project", b: 2, why: "A verb linking two entities." }, { t: "Employee works on task", b: 2, why: "A verb linking two entities." } ] } },

{ name: "Thermal Vents", depth: [1000, 1400], topic: "ER to Relational Model", hull: 4, flora: "vent",
  pal: { top: "#0a1a33", bot: "#08040a", fog: "#1a0f14", floor: "#2a1610" },
  creature: { id: "crab", name: "Orphan Crab", hp: 3,
    practice: "Orphaned foreign keys and missing integrity constraints",
    lore: "It scuttles off with parent rows and leaves the children behind, still pointing at keys that no longer exist.",
    counter: "Declare FOREIGN KEY constraints with sensible ON DELETE and ON UPDATE actions, and give weak entities their owner's key.",
    qs: [
      { q: "The Crab deletes a department, but its employees still list that DeptID. What was violated?", a: "Referential integrity", w: ["Entity integrity", "Domain integrity", "First normal form"], why: "FK values must match an existing PK." },
      { q: "Which ON DELETE action would have removed the orphaned rows automatically?", a: "CASCADE", w: ["RESTRICT", "SET NULL", "SET DEFAULT"], why: "CASCADE deletes the dependent rows too." },
      { q: "A weak entity's table without its owner's key is a crab without a shell. What must it include?", a: "The owner's primary key as part of its own PK", w: ["Only a surrogate key", "Only derived attributes", "Nothing extra"], why: "The owner's PK plus a partial key forms the composite PK." }
    ] },
  mc: [
    { q: "Why convert an ER diagram to a relational model?", a: "To implement it in an RDBMS", w: ["To make UML diagrams", "To generate reports", "To visualize data"], why: "A DBMS builds tables, keys and constraints." },
    { q: "How is a 1:N relationship implemented?", a: "The one side's PK goes in the many side as an FK", w: ["A new bridge table", "An FK on the one side", "Merging the tables"], why: "Example: CustomerID in ORDER." },
    { q: "How is an M:N relationship implemented?", a: "A new relation whose PK combines both PKs", w: ["An FK on either side", "A UNIQUE constraint", "Merging the tables"], why: "Example: Enrolls(S-Id, C-Id)." },
    { q: "In an identifying relationship, the FK is part of the child's ______ key.", a: "primary", w: ["alternate", "candidate", "surrogate"], why: "The child needs its parent to be identified." },
    { q: "How is a subtype table's PK set up?", a: "The same as the supertype's PK, and also an FK to it", w: ["A new surrogate key", "All subtype columns", "Any unique column"], why: "This implements the IsA dependency." },
    { q: "A multivalued attribute like Skill becomes…", a: "A new relation with the entity's PK plus Skill as its PK", w: ["A comma-separated column", "Numbered columns", "A derived column"], why: "Example: EMPLOYEE_SKILL(EmployeeID, Skill)." },
    { q: "Why does a 1:1 FK need UNIQUE?", a: "Without it, many rows could share a parent, making it 1:N", w: ["UNIQUE makes it NOT NULL", "FKs can't be indexed otherwise", "It isn't needed"], why: "UNIQUE limits each parent to one child." },
    { q: "Total participation (a double line) on the FK side becomes…", a: "A NOT NULL foreign key", w: ["A UNIQUE constraint", "A CHECK constraint", "A surrogate key"], why: "Every row must be linked." },
    { q: "Why can't Male–Female Marriage (1:1, partial on both sides) be merged into one table?", a: "No attribute is always NOT NULL", w: ["It's M:N", "The entities are weak", "There are too many attributes"], why: "Neither key could be a NOT NULL primary key." }
  ],
  special: { type: "sort", title: "Route the pipes", prompt: "How is each relationship implemented in tables?",
    bins: ["FK on the many side", "Bridge table", "FK + UNIQUE"],
    items: [
      { t: "Customer places Orders (1:N)", b: 0, why: "CustomerID goes in ORDER." }, { t: "Department has Employees (1:N)", b: 0, why: "DeptID goes in EMPLOYEE." },
      { t: "Employee supervises Employees (1:N)", b: 0, why: "ManagerID is a recursive FK." }, { t: "Student takes Courses (M:N)", b: 1, why: "Use ENROLLS(StudentID, CourseID)." },
      { t: "Product requires Operations (M:N)", b: 1, why: "Use a bridge table with both PKs." }, { t: "Operation uses Machine (1:1)", b: 2, why: "Use a UNIQUE, NOT NULL mc_num." },
      { t: "Employee manages Department (1:1)", b: 2, why: "A UNIQUE FK keeps it one-to-one." } ] } },

{ name: "Abyssal Trench", depth: [1400, 2000], topic: "Normalization", hull: 4, flora: "trench",
  pal: { top: "#050d1f", bot: "#000000", fog: "#03060f", floor: "#0b0d14" },
  creature: { id: "leviathan", name: "Anomaly Leviathan", hp: 4,
    practice: "Unnormalized tables that cause update, insertion and deletion anomalies",
    lore: "The apex predator of bad design. Its body is one enormous table where every fact repeats. Touch one scale and forty others disagree.",
    counter: "Normalize by decomposing tables so each fact lives in exactly one place.",
    qs: [
      { q: "Changing an instructor's phone means editing 40 rows, and one gets missed. Which anomaly is that?", a: "Update anomaly", w: ["Insertion anomaly", "Deletion anomaly", "Transitive dependency"], why: "Repeated facts drift apart." },
      { q: "Deleting the last student in a course also erases the course's room. Which anomaly is that?", a: "Deletion anomaly", w: ["Update anomaly", "Insertion anomaly", "Partial dependency"], why: "Unrelated facts disappear together." },
      { q: "You can't record a new course until a student enrolls. Which anomaly is that?", a: "Insertion anomaly", w: ["Deletion anomaly", "Update anomaly", "Cartesian product"], why: "One fact can't be stored without another." },
      { q: "What cures all three anomalies?", a: "Normalizing: decompose so each fact is stored once", w: ["Adding indexes", "Allowing more NULLs", "Merging tables"], why: "Remove partial and transitive dependencies." }
    ] },
  mc: [
    { q: "X → Y means…", a: "Each X value determines exactly one Y value", w: ["Y determines X", "X and Y are both keys", "X equals Y"], why: "X is the determinant." },
    { q: "A candidate key is…", a: "A minimal super key", w: ["Any set of attributes", "A foreign key", "A non-key column"], why: "It's unique and nothing in it is extra." },
    { q: "A table is in 1NF when…", a: "Every field is atomic with no repeating groups", w: ["It has no partial dependencies", "It has no transitive dependencies", "Every determinant is a key"], why: "No lists or sub-columns." },
    { q: "2NF removes…", a: "Partial dependencies on part of a composite key", w: ["Transitive dependencies", "Repeating groups", "Multivalued dependencies"], why: "Non-key columns must depend on the whole key." },
    { q: "3NF removes…", a: "Transitive dependencies between non-key columns", w: ["Partial dependencies", "Repeating groups", "NULL values"], why: "There can be no non-key → non-key chains." },
    { q: "A table is in BCNF when…", a: "Every determinant is a superkey", w: ["It has a single-column key", "It has no NULLs", "It has no FKs"], why: "BCNF is the most important normal form in practice." },
    { q: "A 1NF table with a single-column primary key is automatically in…", a: "2NF", w: ["3NF", "BCNF", "No normal form"], why: "A partial dependency needs a composite key." },
    { q: "Old(A, B, D) has key (A, B, D) and A → C. What's the BCNF fix?", a: "Old(A, B, D) plus New(A, C) with key A", w: ["Add C to the key", "Delete A", "Make (A, C) Old's key"], why: "A isn't a superkey." },
    { q: "USER(UserID, Email, City, State, Zip): what breaks 3NF?", a: "Zip → City, State", w: ["UserID → Email", "UserID → Zip", "Nothing breaks it"], why: "Split out ZIPCODE(Zip, City, State)." },
    { q: "Does PassengerNumber depend on PassengerName?", a: "No. Two passengers can share a name", w: ["Yes, always", "Only in BCNF", "Only if names are unique today"], why: "A name isn't a reliable identifier." }
  ],
  special: { type: "sort", title: "Classify the fractures", prompt: "Each sample gives a key and a dependency. Is it partial, transitive, or fine?",
    bins: ["Partial: breaks 2NF", "Transitive: breaks 3NF", "Fine"],
    items: [
      { t: "Key (StudentID, CourseID): StudentID → StudentName", b: 0, why: "It depends on part of the key." }, { t: "Key (studio, movie): studio → studio_city", b: 0, why: "It depends on part of the key." },
      { t: "Key (City, Street, HouseNo): City → CityPopulation", b: 0, why: "It depends on part of the key." }, { t: "Key EmpID: DeptID → DeptName", b: 1, why: "It's a non-key → non-key chain." },
      { t: "Key PlayerNo: Team → TeamColor", b: 1, why: "TeamColor depends on Team." }, { t: "Key UserID: Zip → City", b: 1, why: "City depends on Zip." },
      { t: "Key (StudentID, CourseID): (StudentID, CourseID) → Grade", b: 2, why: "It depends on the whole key." }, { t: "Key EmpID: EmpID → DeptID", b: 2, why: "It depends directly on the key." } ] } }
];

const TUT_PLAN = [
  { type: "scan", obj: "drive", q: "What is a primary key?", a: "A column (or columns) that uniquely identifies each row", w: ["Any column that is allowed to be NULL", "A column copied from another table", "The first column in every table"], why: "Primary keys must be unique and can never be NULL." },
  { type: "sort", title: "Key rules", prompt: "Sort each rule to the kind of key it describes.", bins: ["Primary key", "Foreign key"],
    items: [ { t: "Must be unique", b: 0, why: "Each PK value identifies exactly one row." }, { t: "Can never be NULL", b: 0, why: "A NULL key can't identify anything." },
             { t: "Values can repeat", b: 1, why: "Many employees can share the same DeptID." }, { t: "Points to a primary key in another table", b: 1, why: "That's what makes it foreign." } ] },
  { type: "beast", tutorial: true, hp: 1, maxHp: 1, qi: 0, qs: [ { q: "The Redundancy Leech copies the same customer address into three files. What's the risk?", a: "The copies drift apart and conflict", w: ["Queries get faster", "The data becomes more secure", "No risk, because copies are backups"], why: "Duplicate copies drift out of sync. That's data inconsistency." } ] }
];

return { ZONES, TUT_PLAN };
})();
