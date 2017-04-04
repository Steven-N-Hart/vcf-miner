export SYS_PROP=src/main/resources/sys.properties
java -cp target/mongo_svr-2.0.2-SNAPSHOT-jar-with-dependencies.jar edu.mayo.ve.VCFParser.VCFParser $1 $2
