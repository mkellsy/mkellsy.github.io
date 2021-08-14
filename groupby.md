## GROUP BY issue

If you look at this data, you notice that there is duplicated rows. This is valid. However, if the SQL is not maintained, issues could arise.

| OrderID | ProductID | NumUnits | Cost |
| ------- | --------- | -------- | ---- |
| 1       | 157       | 1        | 1.5  |
| 1       | 157       | 1        | 1.5  |
| 2       | 157       | 3        | 3.0  |

If there is a CTE, temp table or view that simplifies raw transaction data that looks like this. Everything should work.

```sql
SELECT
   Orders.OrderID
 , Orders.ProductID
 , Orders.NumUnits
FROM Orders
```

Then to meet requirements of another project, the view is modified to include the cost. And working with the accountants, they required a SUM.

```sql
SELECT
   Orders.OrderID
 , Orders.ProductID
 , Orders.NumUnits
 , SUM(Orders.Cost) AS "TotalCost"
FROM Orders
```

This modified SQL statement is incorrect. In the first example the GROUP BY was implied. In the modifed version the GROUP BY is non-deterministic. This causes the database engine to pick a grouping as it sees fit. This is usually wrong. Implied GROUP BYs are never a good idea. The output will look something like this.

| OrderID | ProductID | NumUnits | Cost |
| ------- | --------- | -------- | ---- |
| 1       | 157       | 1        | 3.0  |
| 2       | 157       | 3        | 3.0  |

The issue is the NumUnits are incorrect.

To correct this issue, the SQL needs to be modified.

```sql
SELECT
   Orders.OrderID
 , Orders.ProductID
 , SUM(Orders.NumUnits) AS "NumUnits"
 , SUM(Orders.Cost) AS "TotalCost"
FROM Orders
GROUP BY
   Orders.OrderID
 , Orders.ProductID
```

The output of this SQL will be this.

| OrderID | ProductID | NumUnits | Cost |
| ------- | --------- | -------- | ---- |
| 1       | 157       | 2        | 3.0  |
| 2       | 157       | 3        | 3.0  |

I believe there is a CTE, temp table or view that is causing the order sheet to be incorrect. This issue is compounded because the order sheet doesn't require the OrderID or Cost fields. In the example above the output is this.

| ProductID | NumUnits |
| --------- | -------- |
| 157       | 4        |

Since the NumUnits GROUP BY is missing, the report is missing one of the transactions.

The proper output should be this.

| ProductID | NumUnits |
| --------- | -------- |
| 157       | 5        |
