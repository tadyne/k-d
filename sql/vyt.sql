CREATE TABLE hrac_pico (
    ID int not null,
    jmeno varchar(25),
    prijmeni varchar(25)

);

CREATE TABLE hra_pico (
    ID int not null ,
    hrac1 int,
    hrac2 int,
    stav int,
    started date,
    vyska int,
    sirka int

);

CREATE TABLE tah (
    ID int not null,
    game int,
    hrac boolean,
    time date,
    vyska int,
    sirka int
    
);

CREATE TABLE tah (
    ID int not null,
	nazev varchar(40)

    
);