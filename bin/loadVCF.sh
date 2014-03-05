export SYS_PROP=src/main/resources/sys.properties
java -cp target/mongo_svr-1.0-SNAPSHOT-jar-with-dependencies.jar edu.mayo.ve.VCFParser.VCFParser $1 $2
