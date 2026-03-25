try:
    from db.neo4j_driver import get_neo4j_session
    print("Import successful")
except ImportError as e:
    print(f"Import failed: {e}")
except Exception as e:
    print(f"Other error: {e}")
