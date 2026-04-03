using System;
using System.Data.SqlClient;
using System.Collections.Generic;

class VerifyMigration
{
    static void Main()
    {
        var connectionString = "Server=db41847.public.databaseasp.net; Database=db41847; User Id=db41847; Password=mH_4%2Jd3Ko-; Encrypt=True; TrustServerCertificate=True; MultipleActiveResultSets=True;";

        var tablesToCheck = new List<string> { "Bowls", "Sections", "SeatingPlans", "Seats" };

        try
        {
            using (var connection = new SqlConnection(connectionString))
            {
                connection.Open();
                Console.WriteLine("✓ Connected to database successfully!");

                foreach (var tableName in tablesToCheck)
                {
                    var query =  "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @TableName";
                    using (var command = new SqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@TableName", tableName);
                        var result = command.ExecuteScalar();

                        if (result != null)
                        {
                            Console.WriteLine($"✓ Table '{tableName}' EXISTS");
                        }
                        else
                        {
                            Console.WriteLine($"✗ Table '{tableName}' NOT FOUND");
                        }
                    }
                }

                // Check for Bowls table columns
                Console.WriteLine("\nChecking Bowls table columns...");
                var columnQuery = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Bowls'";
                using (var command = new SqlCommand(columnQuery, connection))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.HasRows)
                        {
                            Console.WriteLine("Bowls table columns:");
                            while (reader.Read())
                            {
                                Console.WriteLine($"  - {reader["COLUMN_NAME"]}");
                            }
                        }
                        else
                        {
                            Console.WriteLine("No columns found for Bowls table");
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"✗ Error: {ex.Message}");
        }
    }
}
